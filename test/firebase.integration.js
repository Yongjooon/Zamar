import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Timestamp } from 'firebase-admin/firestore';
import { test } from 'node:test';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator, EmailAuthProvider, getAuth, reauthenticateWithCredential,
  signInWithEmailAndPassword, updatePassword,
} from 'firebase/auth';
import {
  connectFirestoreEmulator, doc, getDocFromServer, getDocsFromServer, collection,
  getFirestore, setDoc, terminate, updateDoc, writeBatch,
} from 'firebase/firestore';
import accounts from '../api/accounts.js';
import board from '../api/board.js';
import escape from '../api/escape.js';
import retention from '../api/retention.js';
import { provisionAccount } from '../server/accounts.js';
import { getFirebaseAdmin } from '../server/firebase-admin.js';
import { accountEmail } from '../shared/identity.js';
import { ESCAPE_CLUES } from '../shared/escape.js';
import { weekRetentionCutoff } from '../shared/retention.js';
import { upcomingSunday } from '../src/lib/date.js';

const projectId = 'demo-zamar';
const initialPassword = 'demo-invitation';
const adminPassword = initialPassword;
const adminId = 'zamaradmin';
const emulatorAddress = /^(localhost|127\.0\.0\.1):\d{1,5}$/;
if (!emulatorAddress.test(process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '') ||
    !emulatorAddress.test(process.env.FIRESTORE_EMULATOR_HOST ?? '')) {
  throw new Error('Run this test with local Firebase Auth and Firestore emulators.');
}
process.env.FIREBASE_PROJECT_ID = projectId;
process.env.ZAMAR_INITIAL_PASSWORD = initialPassword;
process.env.CRON_SECRET = 'demo-only-retention-secret';

function sdk(name) {
  const app = initializeApp({ projectId, apiKey: 'demo-api-key' }, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, 'http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST, { disableWarnings: true });
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  return { app, auth, db };
}

async function request(handler, method, body, token, query = {}) {
  const headers = { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) };
  let status;
  const response = { setHeader() {}, status(code) { status = code; return response; }, json(result) { return { status, result }; } };
  return handler({ method, body, headers, query }, response);
}

const seed = () => execFileSync(process.execPath, ['scripts/seed-data.js', '--apply'], { encoding: 'utf8' });

test('Firebase application accounts, Firestore rules, and repeatable seed', async () => {
  const endpoints = [
    'http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST + '/emulator/v1/projects/' + projectId + '/accounts',
    'http://' + process.env.FIRESTORE_EMULATOR_HOST + '/emulator/v1/projects/' + projectId + '/databases/(default)/documents',
  ];
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, { method: 'DELETE' });
    assert.equal(response.ok, true, 'Reset failed for the local demo project');
  }
  const seedWeeks = JSON.parse(readFileSync('src/data/Data.json', 'utf8')).weeks;
  const retainedSeed = seedWeeks.filter(({ sunday }) => sunday >= weekRetentionCutoff());
  assert.match(seed(), new RegExp('Imported ' + retainedSeed.length + ' weeks; skipped 0'));
  assert.match(seed(), new RegExp('Imported 0 weeks; skipped ' + retainedSeed.length));
  const models = getFirebaseAdmin();
  // Only the emulator fixture bootstraps the first admin; account creation always makes members.
  const { account: initialAdmin } = await provisionAccount(models, {
    loginId: adminId, name: '팀장', password: adminPassword, role: 'admin',
  });
  assert.equal(initialAdmin.role, 'user');
  await models.db.doc('users/' + initialAdmin.uid).update({ role: 'admin' });

  const admin = sdk('admin');
  const member = sdk('member');
  const changedPassword = 'member-changed-password';
  const loginId = 'choir.member';
  const future = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000;
  const weekDate = retainedSeed[0]?.sunday ?? upcomingSunday(new Date(future));
  const newSunday = upcomingSunday(new Date(future + 7 * 24 * 60 * 60 * 1000));
  if (retainedSeed.length === 0) {
    const week = models.db.doc('weeks/' + weekDate);
    await week.set({ sunday: weekDate, positionCount: 11, positionsRevision: 0, songsRevision: 0 });
    for (const i of Array.from({length:11}, (_, index) => index)) {
      await week.collection('positions').doc('p' + i).set({ role: 'Role ' + i, assignees: [], order: i });
    }
  }

  try {
    const docFor = (client, ...path) => doc(client.db, ...path);
    await assert.rejects(getDocFromServer(docFor(member, 'weeks', weekDate)), { code: 'permission-denied' });
    const adminUser = (await signInWithEmailAndPassword(admin.auth, accountEmail(adminId), adminPassword)).user;
    const adminToken = await adminUser.getIdToken();
    assert.equal((await request(accounts, 'GET')).status, 401);
    assert.equal((await request(accounts, 'DELETE', { uid: adminUser.uid }, adminToken)).status, 403);
    assert.equal((await request(accounts, 'PATCH', { uid: adminUser.uid, role: 'user' }, adminToken)).status, 409);

    const res = await request(accounts, 'POST', { loginId, name: '팀원', role: 'admin' }, adminToken);
    assert.equal(res.status, 200);
    const { account } = res.result;
    assert.equal(account.status, 'active');
    assert.equal(account.role, 'user');
    assert.equal((await request(accounts, 'POST', { loginId, name: '중복' }, adminToken)).status, 409);
    const user = (await signInWithEmailAndPassword(member.auth, accountEmail(loginId), initialPassword)).user;
    const token = await user.getIdToken();
    assert.equal((await request(escape, 'GET')).status, 401);
    assert.equal((await request(escape, 'POST', { action: 'scan', code: '6371', round: 0 }, token)).status, 400);
    assert.equal((await request(escape, 'POST', { action: 'reset', round: 0 }, token)).status, 409);
    const scan = (index, round = 0) => request(escape, 'POST', { action: 'scan', code: ESCAPE_CLUES[index].token, round, uid: adminUser.uid }, token);
    assert.deepEqual((await scan(1)).result.progress.digits, ['?', '3', '?', '?']);
    assert.equal((await scan(1)).result.alreadyFound, true);
    assert.equal((await request(escape, 'GET', null, adminToken, { uid: user.uid })).result.progress.found, 0);
    assert.equal((await request(escape, 'GET', null, token)).result.progress.found, 1);
    // A separate signed-in session sees the saved state; direct SDK access stays denied.
    const returning = sdk('returning-escape-player');
    try {
      const returningUser = (await signInWithEmailAndPassword(returning.auth, accountEmail(loginId), initialPassword)).user;
      assert.equal((await request(escape, 'GET', null, await returningUser.getIdToken())).result.progress.found, 1);
    } finally {
      await terminate(returning.db);
      await deleteApp(returning.app);
    }
    await assert.rejects(getDocFromServer(docFor(member, 'escapeProgress', user.uid)), { code: 'permission-denied' });
    await assert.rejects(setDoc(docFor(member, 'escapeProgress', user.uid), { opened: ESCAPE_CLUES.map(({ id }) => id) }), { code: 'permission-denied' });
    await Promise.all([scan(0), scan(3)]);
    assert.equal((await request(escape, 'GET', null, token)).result.progress.found, 3);
    const finished = (await scan(2)).result.progress;
    assert.equal(finished.complete, true);
    assert.equal(finished.digits.join(''), '6371');
    assert.equal((await request(escape, 'GET', null, token)).result.progress.complete, true);
    const reset = await request(escape, 'POST', { action: 'reset', round: 0 }, token);
    assert.equal(reset.result.progress.round, 1);
    assert.deepEqual(reset.result.progress.digits, ['?', '?', '?', '?']);
    assert.equal((await scan(0)).status, 409);
    assert.equal((await request(escape, 'POST', { action: 'reset', round: 0 }, token)).status, 409);
    assert.equal((await scan(0, 1)).status, 200);
    assert.equal((await request(accounts, 'GET', null, token)).status, 403);
    assert.equal((await request(accounts, 'DELETE', { uid: account.uid }, token)).status, 403);
    assert.equal((await getDocFromServer(docFor(member, 'users', account.uid))).data().role, 'user');
    await assert.rejects(updateDoc(docFor(member, 'users', account.uid), { role: 'admin' }), { code: 'permission-denied' });
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'admin' })).status, 401);
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'admin' }, token)).status, 403);
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'owner' }, adminToken)).status, 400);
    assert.equal((await request(accounts, 'PATCH', { role: 'admin' }, adminToken)).status, 400);
    assert.equal((await request(accounts, 'PATCH', { uid: 'missing-account', role: 'admin' }, adminToken)).status, 404);
    const deletingProfile = models.db.doc('users/deleting-account');
    await deletingProfile.set({ loginId: 'deleting.member', name: '삭제 중', role: 'user', status: 'deleting' });
    assert.equal((await request(accounts, 'PATCH', { uid: deletingProfile.id, role: 'admin' }, adminToken)).status, 409);
    await deletingProfile.delete();

    const promoted = await request(accounts, 'PATCH', { uid: account.uid, role: 'admin' }, adminToken);
    assert.equal(promoted.status, 200);
    assert.equal(promoted.result.account.role, 'admin');
    assert.equal((await getDocFromServer(docFor(member, 'users', account.uid))).data().role, 'admin');
    // The existing session gains and loses both API and Firestore access without a new token.
    assert.equal((await request(accounts, 'GET', null, token)).status, 200);
    assert.equal((await request(accounts, 'DELETE', { uid: account.uid }, adminToken)).status, 403);
    const teamRef = docFor(member, 'config', 'team');
    const team = (await getDocFromServer(teamRef)).data();
    await updateDoc(teamRef, { teamName: team.teamName });
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'user' }, adminToken)).status, 200);
    assert.equal((await request(accounts, 'GET', null, token)).status, 403);
    await assert.rejects(updateDoc(teamRef, { teamName: team.teamName }), { code: 'permission-denied' });
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'admin' }, adminToken)).status, 200);
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'user' }, token)).status, 200);
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'admin' }, adminToken)).status, 200);

    // Concurrent self-demotions must still leave one active admin.
    const demotions = await Promise.all([
      request(accounts, 'PATCH', { uid: adminUser.uid, role: 'user' }, adminToken),
      request(accounts, 'PATCH', { uid: account.uid, role: 'user' }, token),
    ]);
    assert.deepEqual(demotions.map(({ status }) => status).sort(), [200, 409]);
    if (demotions[0].status === 200) {
      assert.equal((await request(accounts, 'GET', null, adminToken)).status, 403);
      assert.equal((await request(accounts, 'PATCH', { uid: adminUser.uid, role: 'admin' }, token)).status, 200);
    }
    assert.equal((await request(accounts, 'PATCH', { uid: account.uid, role: 'user' }, adminToken)).status, 200);
    assert.equal((await getDocFromServer(docFor(member, 'users', account.uid))).data().role, 'user');
    assert.equal((await request(accounts, 'GET', null, token)).status, 403);
    assert.equal((await getDocFromServer(docFor(member, 'weeks', weekDate))).data().positionCount, 11);
    assert.equal((await getDocsFromServer(collection(member.db, 'weeks', weekDate, 'positions'))).size, 11);

    // Neither unversioned changes nor direct writes by a member can edit the playlist.
    const song = { title: '테스트 곡', videoId: 'M7lc1UVf-VE', order: 0 };
    await assert.rejects(setDoc(docFor(member, 'weeks', weekDate, 'songs', 'first'), song), { code: 'permission-denied' });
    await assert.rejects(setDoc(docFor(admin, 'weeks', weekDate, 'songs', 'first'), song), { code: 'permission-denied' });
    const songBatch = writeBatch(admin.db);
    songBatch.update(docFor(admin, 'weeks', weekDate), { songsRevision: 1 });
    songBatch.set(docFor(admin, 'weeks', weekDate, 'songs', 'first'), song);
    await songBatch.commit();
    assert.equal((await getDocFromServer(docFor(member, 'weeks', weekDate, 'songs', 'first'))).data().videoId, song.videoId);

    const weekBatch = writeBatch(admin.db);
    weekBatch.set(docFor(admin, 'weeks', newSunday), { sunday: newSunday, positionCount: 11, positionsRevision: 0, songsRevision: 0 });
    for (let i = 0; i < 11; i += 1) {
      weekBatch.set(docFor(admin, 'weeks', newSunday, 'positions', 'p' + i), { role: 'Role ' + i, assignees: [], order: i });
    }
    await weekBatch.commit();
    const positionBatch = writeBatch(admin.db);
    positionBatch.update(docFor(admin, 'weeks', newSunday), { positionsRevision: 1 });
    for (let i = 0; i < 11; i += 1) {
      positionBatch.update(docFor(admin, 'weeks', newSunday, 'positions', 'p' + i), { assignees: ['이름'] });
    }
    await positionBatch.commit();
    assert.equal((await getDocsFromServer(collection(member.db, 'weeks', newSunday, 'positions'))).size, 11);
    assert.match(seed(), new RegExp('Imported 0 weeks; skipped ' + retainedSeed.length));
    assert.equal((await getDocFromServer(docFor(member, 'weeks', weekDate, 'songs', 'first'))).exists(), true);

    assert.equal((await request(board, 'GET')).status, 401);
    assert.equal((await request(board, 'POST', { type: 'post', text: '  ' }, token)).status, 400);
    const created = await request(board, 'POST', { type: 'post', text: '익명 본문', author: '테스트' }, token);
    assert.equal(created.status, 200);
    const post = created.result.post;
    const postRef = models.db.doc('boardPosts/' + post.id);
    const storedPost = (await postRef.get()).data();
    assert.deepEqual(Object.keys(storedPost).sort(), ['commentCount', 'createdAt', 'expiresAt', 'ownerKey', 'text']);
    assert.match(storedPost.ownerKey, /^[a-f0-9]{64}$/);
    assert.ok(!JSON.stringify(storedPost).includes(user.uid));
    assert.equal(post.canDelete, true);
    assert.ok(!Object.hasOwn(post, 'ownerKey'));
    await assert.rejects(getDocFromServer(docFor(member, 'boardPosts', post.id)), { code: 'permission-denied' });
    const replied = await request(board, 'POST', { type: 'comment', postId: post.id, text: '익명 댓글', uid: user.uid }, adminToken);
    assert.equal(replied.status, 200);
    assert.deepEqual(Object.keys((await postRef.collection('comments').doc(replied.result.comment.id).get()).data()).sort(), ['createdAt', 'text']);
    assert.equal((await request(board, 'GET', null, token, { postId: post.id })).result.comments[0].id, replied.result.comment.id);

    const expiredPost = models.db.collection('boardPosts').doc();
    await expiredPost.set({ text: '만료됨', createdAt: Timestamp.fromMillis(0), expiresAt: Timestamp.fromMillis(1), commentCount: 1 });
    const expiredComment = await expiredPost.collection('comments').add({ text: '만료 댓글', createdAt: Timestamp.fromMillis(0) });
    const expiredWeek = models.db.doc('weeks/2020-01-05');
    await expiredWeek.set({ sunday: '2020-01-05', positionCount: 1, positionsRevision: 0, songsRevision: 0 });
    const expiredPosition = await expiredWeek.collection('positions').add({ role: '보컬', assignees: [], order: 0 });
    const expiredSong = await expiredWeek.collection('songs').add(song);

    const listed = await request(board, 'GET', null, token);
    assert.deepEqual(listed.result.posts.map(({ id, commentCount }) => [id, commentCount]), [[post.id, 1]]);
    assert.equal((await request(board, 'GET', null, token, { postId: expiredPost.id })).status, 404);
    assert.equal((await request(board, 'POST', { type: 'comment', postId: expiredPost.id, text: '만료됨' }, token)).status, 404);
    assert.equal((await request(retention, 'GET', null, adminToken)).status, 401);
    assert.equal((await expiredWeek.get()).exists, true);
    const cleanup = await request(retention, 'GET', null, process.env.CRON_SECRET);
    assert.deepEqual(cleanup, { status: 200, result: { removed: { weeks: 1, posts: 1 } } });
    for (const deleted of [expiredWeek, expiredPosition, expiredSong, expiredPost, expiredComment]) {
      assert.equal((await deleted.get()).exists, false);
    }
    assert.equal((await postRef.get()).exists, true);
    assert.equal((await models.db.doc('weeks/' + weekDate).get()).exists, true);
    assert.deepEqual((await request(retention, 'GET', null, process.env.CRON_SECRET)).result.removed, { weeks: 0, posts: 0 });

    const ownerView = (await request(board, 'GET', null, token)).result.posts[0];
    const otherView = (await request(board, 'GET', null, adminToken)).result.posts[0];
    assert.equal(ownerView.canDelete, true);
    assert.deepEqual(otherView, { ...ownerView, canDelete: false });
    assert.ok(!Object.hasOwn(ownerView, 'ownerKey'));
    assert.equal((await request(board, 'DELETE', { postId: post.id })).status, 401);
    assert.equal((await request(board, 'DELETE', { postId: post.id, uid: user.uid }, adminToken)).status, 403);
    assert.equal((await postRef.get()).exists, true);
    const legacyPost = await models.db.collection('boardPosts').add({
      text: '예전 익명 글', createdAt: storedPost.createdAt, expiresAt: storedPost.expiresAt, commentCount: 0,
    });
    assert.equal((await request(board, 'DELETE', { postId: legacyPost.id }, token)).status, 403);
    assert.equal((await request(board, 'GET', null, token)).result.posts.find(({ id }) => id === legacyPost.id).canDelete, false);
    assert.equal((await request(board, 'DELETE', { postId: post.id }, token)).status, 200);
    assert.equal((await postRef.get()).exists, false);
    assert.equal((await postRef.collection('comments').doc(replied.result.comment.id).get()).exists, false);
    assert.equal((await request(board, 'GET', null, token, { postId: post.id })).status, 404);
    assert.equal((await request(board, 'GET', null, token)).result.posts.some(({ id }) => id === post.id), false);

    await reauthenticateWithCredential(user, EmailAuthProvider.credential(accountEmail(loginId), initialPassword));
    await updatePassword(user, changedPassword);
    await assert.rejects(signInWithEmailAndPassword(member.auth, accountEmail(loginId), initialPassword));
    await signInWithEmailAndPassword(member.auth, accountEmail(loginId), changedPassword);
    assert.equal((await request(accounts, 'DELETE', { uid: account.uid }, adminToken)).status, 200);
    assert.equal((await request(accounts, 'DELETE', { uid: account.uid }, adminToken)).status, 200);
    assert.equal((await models.db.collection('escapeProgress').doc(account.uid).get()).exists, false);
    await assert.rejects(getDocFromServer(docFor(member, 'weeks', weekDate)), { code: 'permission-denied' });
    assert.equal((await request(board, 'GET', null, token)).status, 401);
    await assert.rejects(models.auth.getUser(account.uid), { code: 'auth/user-not-found' });
  } finally {
    await Promise.all([terminate(admin.db), terminate(member.db)]);
    await Promise.all([deleteApp(admin.app), deleteApp(member.app)]);
    await models.db.terminate();
  }
});

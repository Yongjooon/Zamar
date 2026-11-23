import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
import { getFirebaseAdmin } from '../server/firebase-admin.js';
import { accountEmail } from '../shared/identity.js';

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

function sdk(name) {
  const app = initializeApp({ projectId, apiKey: 'demo-api-key' }, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, 'http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST, { disableWarnings: true });
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  return { app, auth, db };
}

async function request(handler, method, body, token) {
  const headers = { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) };
  let status;
  const response = { setHeader() {}, status(code) { status = code; return response; }, json(result) { return { status, result }; } };
  return handler({ method, body, headers, query: {} }, response);
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
  assert.match(seed(), /Imported 52 weeks; skipped 0/);
  assert.match(seed(), /Imported 0 weeks; skipped 52/);
  execFileSync(process.execPath, ['scripts/create-admin.js', adminId, '관리자'], {
    env: { ...process.env, ZAMAR_ADMIN_PASSWORD: adminPassword }, encoding: 'utf8',
  });

  const admin = sdk('admin');
  const member = sdk('member');
  const models = getFirebaseAdmin();
  const changedPassword = 'member-changed-password';
  const loginId = 'choir.member';
  const weekDate = '2026-01-04';
  const newSunday = '2027-01-03';

  try {
    const docFor = (client, ...path) => doc(client.db, ...path);
    await assert.rejects(getDocFromServer(docFor(member, 'weeks', weekDate)), { code: 'permission-denied' });
    const adminUser = (await signInWithEmailAndPassword(admin.auth, accountEmail(adminId), adminPassword)).user;
    const adminToken = await adminUser.getIdToken();
    assert.equal((await request(accounts, 'GET')).status, 401);
    assert.equal((await request(accounts, 'DELETE', { uid: adminUser.uid }, adminToken)).status, 403);

    const res = await request(accounts, 'POST', { loginId, name: '팀원' }, adminToken);
    assert.equal(res.status, 200);
    const { account } = res.result;
    assert.equal(account.status, 'active');
    assert.equal((await request(accounts, 'POST', { loginId, name: '중복' }, adminToken)).status, 409);
    const user = (await signInWithEmailAndPassword(member.auth, accountEmail(loginId), initialPassword)).user;
    const token = await user.getIdToken();
    assert.equal((await request(accounts, 'GET', null, token)).status, 403);
    assert.equal((await request(accounts, 'DELETE', { uid: account.uid }, token)).status, 403);
    assert.equal((await getDocFromServer(docFor(member, 'users', account.uid))).data().role, 'user');
    await assert.rejects(updateDoc(docFor(member, 'users', account.uid), { role: 'admin' }), { code: 'permission-denied' });
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
    assert.match(seed(), /Imported 0 weeks; skipped 52/);
    assert.equal((await getDocFromServer(docFor(member, 'weeks', weekDate, 'songs', 'first'))).exists(), true);

    await reauthenticateWithCredential(user, EmailAuthProvider.credential(accountEmail(loginId), initialPassword));
    await updatePassword(user, changedPassword);
    await assert.rejects(signInWithEmailAndPassword(member.auth, accountEmail(loginId), initialPassword));
    await signInWithEmailAndPassword(member.auth, accountEmail(loginId), changedPassword);
    assert.equal((await request(accounts, 'DELETE', { uid: account.uid }, adminToken)).status, 200);
    assert.equal((await request(accounts, 'DELETE', { uid: account.uid }, adminToken)).status, 200);
    await assert.rejects(getDocFromServer(docFor(member, 'weeks', weekDate)), { code: 'permission-denied' });
    await assert.rejects(models.auth.getUser(account.uid), { code: 'auth/user-not-found' });
  } finally {
    await Promise.all([terminate(admin.db), terminate(member.db)]);
    await Promise.all([deleteApp(admin.app), deleteApp(member.app)]);
    await models.db.terminate();
  }
});

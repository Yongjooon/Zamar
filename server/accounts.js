import { accountEmail, LOGIN_ID_PATTERN, normalizeLoginId } from '../shared/identity.js';
import { HttpError } from './http.js';

export async function listAccounts(db, after) {
  let query = db.collection('users').orderBy('loginId').limit(51);
  if (typeof after === 'string' && LOGIN_ID_PATTERN.test(after)) query = query.startAfter(after);
  const snapshot = await query.get();
  const accounts = snapshot.docs.slice(0, 50).map((doc) => ({ uid: doc.id, ...doc.data() }));
  return { accounts, next: snapshot.size > 50 ? accounts.at(-1).loginId : null };
}

export async function provisionAccount({ auth, db }, { loginId: inputId, name: inputName, password }) {
  const loginId = normalizeLoginId(inputId);
  const name = typeof inputName === 'string' ? inputName.trim() : '';
  if (!LOGIN_ID_PATTERN.test(loginId) || name.length < 1 || name.length > 60) {
    throw new HttpError(400, '아이디는 영문·숫자로 시작하는 3~40자, 이름은 1~60자로 입력해 주세요.');
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    throw new Error('The account password must contain between 6 and 128 characters.');
  }

  let user;
  try {
    user = await auth.createUser({ email: accountEmail(loginId), password, displayName: name, disabled: true });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') throw new HttpError(409, '이미 사용 중인 아이디입니다.');
    throw error;
  }

  const profile = { loginId, name, role: 'user', status: 'active' };
  const ref = db.collection('users').doc(user.uid);
  try {
    await ref.create(profile);
    await auth.updateUser(user.uid, { disabled: false });
  } catch (error) {
    // Keep Firestore access closed if enabling Auth fails, including ambiguous responses.
    const rollback = await Promise.allSettled([ref.delete(), auth.deleteUser(user.uid)]);
    if (rollback.some((result) => result.status === 'rejected')) console.error('Failed to roll back account creation');
    throw error;
  }

  return { account: { ...profile, uid: user.uid } };
}

export async function changeAccountRole({ db }, uid, role, adminUid) {
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new HttpError(400, '유효한 계정을 선택해 주세요.');
  }
  if (role !== 'admin' && role !== 'user') {
    throw new HttpError(400, '변경할 권한이 올바르지 않습니다.');
  }

  const profileRef = db.collection('users').doc(uid);
  return db.runTransaction(async (transaction) => {
    // Recheck the caller in the same transaction as the role change.
    const admin = (await transaction.get(db.collection('users').doc(adminUid))).data();
    if (admin?.role !== 'admin' || admin.status !== 'active') {
      throw new HttpError(403, '관리자 권한이 필요합니다.');
    }
    const profile = (await transaction.get(profileRef)).data();
    if (!profile) throw new HttpError(404, '계정을 찾을 수 없습니다.');
    if (profile.status !== 'active') throw new HttpError(409, '삭제 중인 계정의 권한은 변경할 수 없습니다.');
    if (profile.role === 'admin' && role === 'user') {
      const admins = await transaction.get(db.collection('users').where('role', '==', 'admin'));
      if (!admins.docs.some((entry) => entry.id !== uid && entry.data().status === 'active')) {
        throw new HttpError(409, '마지막 팀장의 관리자 등록은 해제할 수 없습니다. 다른 팀원을 먼저 관리자로 등록해 주세요.');
      }
    }
    transaction.update(profileRef, { role });
    return { account: { ...profile, uid, role } };
  });
}

export async function deleteAccount({ auth, db }, uid, adminUid) {
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new HttpError(400, '유효한 계정을 선택해 주세요.');
  }
  if (uid === adminUid) throw new HttpError(403, '현재 관리자 계정은 삭제할 수 없습니다.');

  const profileRef = db.collection('users').doc(uid);
  const found = await db.runTransaction(async (transaction) => {
    const profile = (await transaction.get(profileRef)).data();
    if (!profile) return false;
    if (profile.role !== 'user') throw new HttpError(403, '관리자 계정은 이 화면에서 삭제할 수 없습니다.');
    // Access ends immediately, even when the Auth user deletion needs a retry.
    transaction.update(profileRef, { status: 'deleting' });
    return true;
  });
  if (!found) return;

  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }
  await db.collection('escapeProgress').doc(uid).delete();
  await profileRef.delete();
}

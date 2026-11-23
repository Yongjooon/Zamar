import { useEffect, useState } from 'react';
import {
  EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential,
  signInWithEmailAndPassword, updatePassword,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { accountEmail, isPasswordValid, LOGIN_ID_PATTERN, normalizeLoginId } from '../../shared/identity.js';
import { auth, db } from './firebase.js';

export function useSession() {
  const [identity, setIdentity] = useState(undefined);
  const [record, setRecord] = useState(null);

  useEffect(() => onAuthStateChanged(auth, setIdentity), []);

  const uid = identity?.uid;
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, 'users', uid), (snapshot) => {
      setRecord({ uid, profile: snapshot.data() ?? null });
    }, () => setRecord({ uid, error: '계정 권한을 확인하지 못했습니다.' }));
  }, [uid]);

  const account = record?.uid === uid ? record : null;
  return { identity, account, loading: identity === undefined || Boolean(uid && !account) };
}

export async function signIn(rawId, password) {
  const id = normalizeLoginId(rawId);
  if (!LOGIN_ID_PATTERN.test(id)) throw new Error('아이디 또는 비밀번호를 확인해 주세요.');
  try {
    await signInWithEmailAndPassword(auth, accountEmail(id), password);
  } catch (error) {
    if (error.code === 'auth/too-many-requests') throw new Error('로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.');
    if (error.code === 'auth/network-request-failed') throw new Error('인터넷 연결을 확인해 주세요.');
    throw new Error('아이디 또는 비밀번호를 확인해 주세요.');
  }
}

export async function changePassword(current, password) {
  if (!isPasswordValid(password) || current === password) {
    throw new Error('현재 비밀번호와 다른 6~128자의 새 비밀번호를 입력해 주세요.');
  }
  const user = auth.currentUser;
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
    await updatePassword(user, password);
  } catch (error) {
    if (error.code === 'auth/weak-password' || error.code === 'auth/password-does-not-meet-requirements') {
      throw new Error('새 비밀번호가 보안 조건을 충족하지 않습니다.');
    }
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('현재 비밀번호를 확인해 주세요.');
    }
    throw new Error('비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

export async function apiRequest(path, { method = 'GET', data, authorized = false, signal } = {}) {
  const headers = {};
  if (authorized) {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    headers.Authorization = 'Bearer ' + await user.getIdToken();
  }
  if (data) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, { method, headers, signal, body: data && JSON.stringify(data) });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error ?? '서버에 연결하지 못했습니다.');
  return result;
}

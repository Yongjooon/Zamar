import { getFirebaseAdmin } from './firebase-admin.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function route(methods, action) {
  return async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (!methods.includes(request.method)) {
      response.setHeader('Allow', methods.join(', '));
      return response.status(405).json({ error: '지원하지 않는 요청입니다.' });
    }
    try {
      if (request.method !== 'GET' && !request.headers['content-type']?.startsWith('application/json')) {
        throw new HttpError(415, 'JSON 요청만 지원합니다.');
      }
      const result = await action(getFirebaseAdmin(), request);
      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
      console.error('Firebase request failed', error.code ?? error.name);
      return response.status(500).json({ error: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    }
  };
}

export async function requireActiveUser({ auth, db }, request) {
  const token = /^Bearer ([^ ]+)$/.exec(request.headers.authorization ?? '')?.[1];
  if (!token) throw new HttpError(401, '로그인이 필요합니다.');

  let identity;
  try {
    identity = await auth.verifyIdToken(token, true);
  } catch {
    throw new HttpError(401, '다시 로그인해 주세요.');
  }
  const profile = (await db.collection('users').doc(identity.uid).get()).data();
  if (profile?.status !== 'active') throw new HttpError(403, '사용할 수 있는 계정이 없습니다.');
  return { uid: identity.uid, profile };
}

export async function requireAdmin(firebase, request) {
  const { uid, profile } = await requireActiveUser(firebase, request);
  if (profile.role !== 'admin') throw new HttpError(403, '관리자 권한이 필요합니다.');
  return uid;
}

import { FieldValue } from 'firebase-admin/firestore';
import { ESCAPE_CLUES, escapeState, escapeView } from '../shared/escape.js';
import { HttpError } from './http.js';

export async function loadEscapeProgress(db, uid) {
  return { progress: escapeView((await db.collection('escapeProgress').doc(uid).get()).data()) };
}

export async function updateEscapeProgress(db, uid, { action, code, round } = {}) {
  if (!['scan', 'reset'].includes(action) || !Number.isSafeInteger(round) || round < 0) {
    throw new HttpError(400, '올바른 게임 진행 요청이 아닙니다.');
  }
  const clue = action === 'scan' && ESCAPE_CLUES.find(({ token }) => token === code);
  if (action === 'scan' && !clue) throw new HttpError(400, '자마르 방탈출 QR 코드가 아닙니다.');

  const ref = db.collection('escapeProgress').doc(uid);
  return db.runTransaction(async (transaction) => {
    const current = escapeState((await transaction.get(ref)).data());
    if (current.round !== round) {
      throw new HttpError(409, '다른 화면에서 게임이 초기화되었습니다. 진행 상태를 확인한 뒤 다시 촬영해 주세요.');
    }
    if (action === 'reset') {
      if (current.opened.length !== ESCAPE_CLUES.length) throw new HttpError(409, '네 자리 숫자를 모두 찾은 뒤 초기화할 수 있습니다.');
      const next = { round: current.round + 1, opened: [] };
      transaction.set(ref, { ...next, updatedAt: FieldValue.serverTimestamp() });
      return { progress: escapeView(next) };
    }
    if (current.opened.includes(clue.id)) return { progress: escapeView(current), alreadyFound: true };
    const next = { ...current, opened: [...current.opened, clue.id] };
    transaction.set(ref, { ...next, updatedAt: FieldValue.serverTimestamp() });
    return { progress: escapeView(next), alreadyFound: false };
  });
}

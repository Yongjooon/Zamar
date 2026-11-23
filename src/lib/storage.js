import { useEffect, useState } from 'react';
import { collection, doc, getDocFromServer, getDocsFromServer, onSnapshot, orderBy, query, runTransaction, setDoc } from 'firebase/firestore';
import { isSunday, isTimeZone, MAX_ENTRIES, POSITION_ROLES } from '../../shared/team.js';
import { db } from './firebase.js';

export function useTeam() {
  const [team, setTeam] = useState(null);
  const [weeks, setWeeks] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const stopTeam = onSnapshot(doc(db, 'config', 'team'), (snapshot) => {
      if (snapshot.exists()) setTeam(snapshot.data());
      else setError('팀 정보가 없습니다. 초기 데이터 이관을 확인해 주세요.');
    }, () => setError('팀 정보를 불러오지 못했습니다.'));
    const stopWeeks = onSnapshot(query(collection(db, 'weeks'), orderBy('sunday')), (snapshot) => {
      setWeeks(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    }, () => setError('주차 목록을 불러오지 못했습니다.'));
    return () => {
      stopTeam();
      stopWeeks();
    };
  }, []);

  return { team, weeks, error };
}

export function useWeekEntries(sunday, kind) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!sunday) return;
    const items = query(collection(db, 'weeks', sunday, kind), orderBy('order'));
    return onSnapshot(items, (snapshot) => {
      setResult({ sunday, kind, entries: snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) });
    }, () => setResult({ sunday, kind, error: '목록을 불러오지 못했습니다.' }));
  }, [kind, sunday]);

  return result?.sunday === sunday && result.kind === kind ? result : null;
}

export async function createWeek(sunday) {
  if (!isSunday(sunday)) throw new Error('일요일 날짜를 선택해 주세요.');
  const weekRef = doc(db, 'weeks', sunday);
  await runTransaction(db, async (transaction) => {
    if ((await transaction.get(weekRef)).exists()) throw new Error('이미 등록된 주차입니다.');
    transaction.set(weekRef, {
      sunday, positionCount: POSITION_ROLES.length, positionsRevision: 0, songsRevision: 0,
    });
    POSITION_ROLES.forEach((role, order) => {
      transaction.set(doc(weekRef, 'positions', 'p' + (order + 1)), { role, assignees: [], order });
    });
  });
}

export async function loadEditorEntries(sunday, kind) {
  const weekRef = doc(db, 'weeks', sunday);
  const versionField = kind === 'positions' ? 'positionsRevision' : 'songsRevision';
  const before = (await getDocFromServer(weekRef)).data();
  if (!before) throw new Error('주차를 찾을 수 없습니다.');
  const snapshot = await getDocsFromServer(query(collection(weekRef, kind), orderBy('order')));
  const after = (await getDocFromServer(weekRef)).data();
  if (before[versionField] !== after?.[versionField]) {
    throw new Error('목록이 변경되었습니다. 편집을 닫고 다시 열어 주세요.');
  }
  return { revision: before[versionField], entries: snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) };
}

export async function saveWeekEntries(sunday, kind, originalIds, revision, entries) {
  if (entries.length > MAX_ENTRIES) throw new Error('한 주차에는 최대 30개까지 등록할 수 있습니다.');
  const weekRef = doc(db, 'weeks', sunday);
  const versionField = kind === 'positions' ? 'positionsRevision' : 'songsRevision';
  const changedIds = new Set(entries.map(({ id }) => id));
  return runTransaction(db, async (transaction) => {
    const record = (await transaction.get(weekRef)).data();
    if (!record || record[versionField] !== revision) {
      throw new Error('다른 변경사항이 저장되었습니다. 편집을 닫고 목록을 다시 확인해 주세요.');
    }
    for (const id of originalIds) {
      if (!changedIds.has(id)) transaction.delete(doc(weekRef, kind, id));
    }
    entries.forEach(({ id, ...fields }, order) => {
      transaction.set(doc(weekRef, kind, id), { ...fields, order });
    });
    transaction.update(weekRef, {
      [versionField]: revision + 1,
      ...(kind === 'positions' ? { positionCount: entries.length } : {}),
    });
  });
}

export async function saveTeam(teamName, timezone) {
  if (!teamName || teamName.length > 80 || !isTimeZone(timezone)) {
    throw new Error('팀 이름과 올바른 시간대(예: Asia/Seoul)를 입력해 주세요.');
  }
  await setDoc(doc(db, 'config', 'team'), { teamName, timezone });
}

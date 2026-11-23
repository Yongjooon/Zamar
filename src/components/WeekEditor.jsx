import { useEffect, useState } from 'react';
import { MAX_ASSIGNEES, MAX_ENTRIES } from '../../shared/team.js';
import { loadEditorEntries, saveWeekEntries } from '../lib/storage.js';
import { getVideoId, youtubeUrl } from '../lib/youtube.js';

export default function WeekEditor({ sunday, kind, onClose, onSaved }) {
  const [source, setSource] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const positions = kind === 'positions';

  useEffect(() => {
    let active = true;
    loadEditorEntries(sunday, kind).then((data) => {
      if (!active) return;
      setSource(data);
      setRows(data.entries.map((row) => kind === 'positions'
        ? { id: row.id, role: row.role, assignees: row.assignees.join(', ') }
        : { id: row.id, title: row.title, url: youtubeUrl(row.videoId) }));
    }).catch((error) => {
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, [sunday, kind]);

  function change(id, field, value) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  }

  function add() {
    if (rows.length === MAX_ENTRIES) return;
    const id = crypto.randomUUID();
    const row = positions ? { id, role: '', assignees: '' } : { id, title: '', url: '' };
    setRows((current) => [...current, row]);
  }

  function move(index, amount) {
    const next = [...rows];
    [next[index], next[index + amount]] = [next[index + amount], next[index]];
    setRows(next);
  }

  async function submit(event) {
    event.preventDefault();
    if (!source || busy) return;
    setError('');
    setBusy(true);
    try {
      const entries = rows.map((row) => {
        if (positions) {
          const role = row.role.trim();
          const assignees = row.assignees.split(',').map((name) => name.trim()).filter(Boolean);
          if (!role || assignees.length > MAX_ASSIGNEES || assignees.some((name) => name.length > 60)) {
            throw new Error('포지션 이름을 입력하고, 담당자는 60자 이내로 최대 30명까지 입력해 주세요.');
          }
          return { id: row.id, role, assignees };
        }
        const title = row.title.trim();
        const videoId = getVideoId(row.url);
        if (!title || !videoId) throw new Error('모든 곡의 제목과 올바른 YouTube 영상 링크를 입력해 주세요.');
        return { id: row.id, title, videoId };
      });
      if (positions && new Set(entries.map(({ role }) => role)).size !== entries.length) {
        throw new Error('같은 이름의 포지션이 있습니다.');
      }
      await saveWeekEntries(sunday, kind, source.entries.map(({ id }) => id), source.revision, entries);
      onSaved(positions ? '포지션을 저장했습니다.' : 'Setlist를 저장했습니다.');
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card scrollCard">
      <div className="cardHead">
        <div><strong>{positions ? '포지션 편집' : 'Setlist 편집'}</strong><div className="weekHint">{sunday}</div></div>
        <button type="button" className="ghostBtn" onClick={onClose} disabled={busy}>닫기</button>
      </div>
      <form className="formStack padded" onSubmit={submit}>
        {!source && !error && <p className="weekHint" role="status">편집할 목록을 불러오는 중…</p>}
        {rows.map((row, index) => (
          <fieldset key={row.id} className="formStack editorRow" disabled={busy}>
            <legend>{positions ? '포지션' : '곡'} {index + 1}</legend>
            {positions ? (
              <>
                <label>포지션 이름<input className="input" value={row.role} maxLength={60} required onChange={(event) => change(row.id, 'role', event.target.value)} /></label>
                <label>담당자 <span className="weekHint">여러 명이면 쉼표로 구분</span><input className="input" value={row.assignees} onChange={(event) => change(row.id, 'assignees', event.target.value)} /></label>
              </>
            ) : (
              <>
                <label>곡 제목<input className="input" value={row.title} maxLength={120} required onChange={(event) => change(row.id, 'title', event.target.value)} /></label>
                <label>YouTube 링크<input className="input" type="url" value={row.url} maxLength={1000} autoCapitalize="none" required onChange={(event) => change(row.id, 'url', event.target.value)} /></label>
              </>
            )}
            <div className="actionRow">
              <button className="ghostBtn" type="button" onClick={() => move(index, -1)} disabled={index === 0}>위로</button>
              <button className="ghostBtn" type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1}>아래로</button>
              <button className="ghostBtn" type="button" onClick={() => setRows((current) => current.filter(({ id }) => id !== row.id))}>빼기</button>
            </div>
          </fieldset>
        ))}
        {error && <p className="formError" role="alert">{error}</p>}
        {source && (
          <div className="actionRow">
            <button className="ghostBtn" type="button" onClick={add} disabled={busy || rows.length === MAX_ENTRIES}>{positions ? '포지션 추가' : '곡 추가'}</button>
            <button className="primaryBtn" type="submit" disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
          </div>
        )}
      </form>
    </section>
  );
}

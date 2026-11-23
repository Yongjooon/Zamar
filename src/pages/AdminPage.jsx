import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/session.js';
import { saveTeam } from '../lib/storage.js';
import Modal from '../components/Modal.jsx';

const statusText = { active: '사용 중', deleting: '삭제 중' };

function getAccounts(after, signal) {
  return apiRequest(after ? '/api/accounts?after=' + encodeURIComponent(after) : '/api/accounts', {
    authorized: true, signal,
  });
}

export default function AdminPage({ team, onToast }) {
  const [result, setResult] = useState(null);
  const [after, setAfter] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [teamError, setTeamError] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const request = new AbortController();
    getAccounts('', request.signal).then((res) => {
      setResult(res.accounts);
      setAfter(res.next);
    }).catch((error) => {
      if (!request.signal.aborted) setError(error.message);
    });
    return () => request.abort();
  }, []);

  async function create(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setCreateError('');
    try {
      await apiRequest('/api/accounts', {
        method: 'POST', data: Object.fromEntries(new FormData(form)), authorized: true,
      });
      form.reset();
      onToast('계정을 만들었습니다.');
      const fresh = await getAccounts('');
      setResult(fresh.accounts);
      setAfter(fresh.next);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy || !selectedAccount) return;
    setBusy(true);
    setDeleteError('');
    try {
      await apiRequest('/api/accounts', { method: 'DELETE', data: { uid: selectedAccount.uid }, authorized: true });
      setResult((accounts) => accounts.filter(({ uid }) => uid !== selectedAccount.uid));
      setSelectedAccount(null);
      onToast('계정을 삭제했습니다.');
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function more() {
    setLoadingMore(true);
    setError('');
    try {
      const next = await getAccounts(after);
      setResult((accounts) => [...accounts, ...next.accounts.filter((entry) => !accounts.some((item) => item.uid === entry.uid))]);
      setAfter(next.next);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function updateTeam(event) {
    event.preventDefault();
    const { teamName, timezone } = Object.fromEntries(new FormData(event.currentTarget));
    setSavingTeam(true);
    setTeamError('');
    try {
      await saveTeam(teamName.trim(), timezone.trim());
      onToast('팀 설정을 저장했습니다.');
    } catch (error) {
      setTeamError(error.message);
    } finally {
      setSavingTeam(false);
    }
  }

  return (
    <div className="adminGrid">
      <section className="card adminAccounts">
        <div className="cardHead"><h2>계정 목록</h2></div>
        <div className="padded formStack">
          {error && <p className="formError" role="alert">{error}</p>}
          {!result && !error && <p className="weekHint" role="status">계정을 불러오는 중…</p>}
          {result?.map((account) => (
            <div className="row wrapRow" key={account.uid}>
              <div className="entryLabel">
                <strong>{account.name}</strong>
                <div className="weekHint">{account.loginId} · {account.role === 'admin' ? '관리자' : statusText[account.status]}</div>
              </div>
              {account.role === 'user' && <button className="ghostBtn dangerText" type="button" disabled={busy || loadingMore} onClick={() => { setDeleteError(''); setSelectedAccount(account); }}>{account.status === 'deleting' ? '삭제 재시도' : '삭제'}</button>}
            </div>
          ))}
          {after && <button className="ghostBtn" type="button" disabled={busy || loadingMore} onClick={more}>더 보기</button>}
        </div>
      </section>
      <div className="adminForms">
        <section className="card">
          <div className="cardHead"><h2>계정 추가</h2></div>
          <form className="formStack padded" onSubmit={create}>
            <label>아이디<input name="loginId" className="input" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={40} placeholder="영문·숫자, 점, 밑줄, 하이픈" required /></label>
            <label>이름<input name="name" className="input" maxLength={60} required /></label>
            {createError && <p className="formError" role="alert">{createError}</p>}
            <button className="primaryBtn" type="submit" disabled={busy || loadingMore}>계정 만들기</button>
          </form>
        </section>
        <section className="card">
          <div className="cardHead"><h2>팀 설정</h2></div>
          <form className="formStack padded" onSubmit={updateTeam}>
            <label>팀 이름<input className="input" name="teamName" defaultValue={team.teamName} maxLength={80} required /></label>
            <label>시간대<input className="input" name="timezone" defaultValue={team.timezone} maxLength={64} required /></label>
            {teamError && <p className="formError" role="alert">{teamError}</p>}
            <button className="primaryBtn" type="submit" disabled={savingTeam}>팀 설정 저장</button>
          </form>
        </section>
      </div>
      {selectedAccount && (
        <Modal title="이 계정을 삭제할까요?" dismissible={!busy} onClose={() => setSelectedAccount(null)}>
          <p className="weekHint">{selectedAccount.name} ({selectedAccount.loginId}) 계정을 삭제합니다.</p>
          {deleteError && <p className="formError" role="alert">{deleteError}</p>}
          <div className="actionRow dialogActions">
            <button type="button" className="ghostBtn" disabled={busy} onClick={() => setSelectedAccount(null)}>취소</button>
            <button type="button" className="dangerBtn" disabled={busy} onClick={remove}>{busy ? '삭제 중…' : '삭제하기'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

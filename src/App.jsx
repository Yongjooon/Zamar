import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import './App.css';

import AppShell from './components/AppShell.jsx';
import Icon from './components/Icon.jsx';
import Toast from './components/Toast.jsx';
import WeekEditor from './components/WeekEditor.jsx';
import WeekToolbar from './components/WeekToolbar.jsx';
import AdminPage from './pages/AdminPage.jsx';
import BoardPage from './pages/BoardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PasswordPage from './pages/PasswordPage.jsx';
import PositionsPage from './pages/PositionsPage.jsx';
import SetlistPage from './pages/SetlistPage.jsx';

import { findCurrentWeekIndex, upcomingSunday } from './lib/date.js';
import { auth, firebaseReady } from './lib/firebase.js';
import { useSession } from './lib/session.js';
import { createWeek, useTeam, useWeekEntries } from './lib/storage.js';
import { useHashRoute } from './lib/useHashRoute.js';

const pages = {
  positions: { title: '포지션 배정', description: '주차별 예배 담당자를 확인하세요.' },
  setlist: { title: 'Setlist', description: '주차별 찬양곡을 확인하고 재생하세요.' },
  board: { title: '익명 게시판' },
  password: { title: '비밀번호 변경' },
  admin: { title: '관리자' },
};

function StatusPage({ message, canLogout = false }) {
  return (
    <main className="loginShell">
      <section className="card loginCard formStack">
        <div className="brand"><span className="brandMark" aria-hidden="true">Z<span>.</span></span><strong>Zamar</strong></div>
        <p role="status">{message}</p>
        {canLogout && <button className="ghostBtn" type="button" onClick={() => signOut(auth)}>로그아웃</button>}
      </section>
    </main>
  );
}

function AuthenticatedApp() {
  const { identity, account, loading } = useSession();
  if (loading) return <StatusPage message="로그인 상태를 확인하는 중…" />;
  if (!identity) return <LoginPage />;
  if (account?.profile?.status !== 'active') {
    return <StatusPage message={account?.error ?? '사용할 수 있는 계정이 없습니다. 관리자에게 문의해 주세요.'} canLogout />;
  }
  return <TeamApp key={identity.uid} profile={account.profile} />;
}

function NewWeekForm({ initialDate, onCreated, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const sunday = new FormData(event.currentTarget).get('sunday');
    setBusy(true);
    setError('');
    try {
      await createWeek(sunday);
      onCreated(sunday);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card compactCard">
      <div className="cardHead"><h2>일요일 선택</h2><button className="ghostBtn" type="button" onClick={onClose} disabled={busy}>닫기</button></div>
      <form className="formStack padded" onSubmit={submit}>
        <label>일요일<input className="input" name="sunday" type="date" defaultValue={initialDate} required /></label>
        {error && <p className="formError" role="alert">{error}</p>}
        <button className="primaryBtn" type="submit" disabled={busy}>{busy ? '추가 중…' : '주차 추가'}</button>
      </form>
    </section>
  );
}

function TeamApp({ profile }) {
  const requestedRoute = useHashRoute();
  const admin = profile.role === 'admin';
  const route = requestedRoute === 'admin' && !admin ? 'positions' : requestedRoute;
  const [now, setNow] = useState(() => new Date());
  const { team, weeks, error } = useTeam(now);
  const [toast, setToast] = useState('');
  const [selectedSunday, setSelectedSunday] = useState(null);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const selectedIndex = weeks?.findIndex(({ sunday }) => sunday === selectedSunday) ?? -1;
  const weekIndex = selectedIndex >= 0 ? selectedIndex : findCurrentWeekIndex(weeks ?? [], team?.timezone, now);
  const week = weeks?.[weekIndex];
  const kind = route === 'setlist' ? 'songs' : 'positions';
  const result = useWeekEntries(['setlist', 'positions'].includes(route) ? week?.sunday : null, kind);
  const activeEditor = admin && editor?.route === route && editor.sunday === week?.sunday ? editor.type : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  function selectWeek(index) {
    if (!weeks?.[index]) return;
    setSelectedSunday(weeks[index].sunday);
    setEditor(null);
  }

  function openEditor(type) {
    setEditor({ type, route, sunday: week?.sunday });
    window.scrollTo({ top: 0 });
  }

  function finishedWeek(sunday) {
    setSelectedSunday(sunday);
    setEditor(null);
    setToast('새 주차를 추가했습니다.');
  }

  const weeklyPage = route === 'positions' || route === 'setlist';
  const needsTeam = weeklyPage || route === 'admin';
  const { title, description } = pages[route];

  return (
    <AppShell teamName={team?.teamName ?? 'Zamar'} profile={profile} route={route}
      onNavigate={() => setEditor(null)} onLogout={() => signOut(auth)}>
      <header className="pageHeader">
        <h1>{activeEditor === 'new' ? '주차 추가' : activeEditor === 'edit' ? title + ' 편집' : title}</h1>
        {description && !activeEditor && <p>{description}</p>}
      </header>
      {needsTeam && error && <p className="statusBanner formError" role="alert">{error}</p>}
      {needsTeam && (!team || !weeks) && !error && <p className="statusBanner weekHint" role="status">팀 정보를 불러오는 중…</p>}

      {team && weeks && weeklyPage && !activeEditor && (
        <>
          <WeekToolbar weeks={weeks} weekIndex={weekIndex} onSelectWeek={selectWeek}>
            {admin && (week || route === 'positions') && <>
              {week && <button className="ghostBtn" type="button" onClick={() => openEditor('edit')}>
                <Icon name="edit" />{route === 'positions' ? '배정 편집' : '곡 편집'}
              </button>}
              {route === 'positions' && <button className="primaryBtn" type="button" onClick={() => openEditor('new')}>
                <Icon name="plus" />주차 추가
              </button>}
            </>}
          </WeekToolbar>
          {route === 'positions'
            ? <PositionsPage week={week} result={result} />
            : <SetlistPage key={week?.sunday} week={week} result={result} />}
        </>
      )}
      {activeEditor === 'edit' && <WeekEditor key={route + week.sunday} sunday={week.sunday} kind={kind} onClose={() => setEditor(null)} onSaved={setToast} />}
      {activeEditor === 'new' && <NewWeekForm initialDate={upcomingSunday(now, team?.timezone)} onCreated={finishedWeek} onClose={() => setEditor(null)} />}

      {route === 'board' && <BoardPage now={now} onToast={setToast} />}
      {route === 'password' && <PasswordPage onToast={setToast} />}
      {team && route === 'admin' && <AdminPage team={team} onToast={setToast} />}
      <Toast message={toast} onClose={() => setToast('')} />
    </AppShell>
  );
}

export default function App() {
  if (!firebaseReady) return <StatusPage message="Firebase 연결 설정이 필요합니다. 개발자 또는 관리자에게 문의해 주세요." />;
  return <AuthenticatedApp />;
}

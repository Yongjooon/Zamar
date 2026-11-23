import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import './App.css';

import Topbar from './components/Topbar.jsx';
import Drawer from './components/Drawer.jsx';
import Icon from './components/Icon.jsx';
import Toast from './components/Toast.jsx';
import WeekEditor from './components/WeekEditor.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PasswordPage from './pages/PasswordPage.jsx';
import PositionsPage from './pages/PositionsPage.jsx';
import SetlistPage from './pages/SetlistPage.jsx';

import { findCurrentWeekIndex, upcomingSunday } from './lib/date.js';
import { auth, firebaseReady } from './lib/firebase.js';
import { useSession } from './lib/session.js';
import { createWeek, useTeam, useWeekEntries } from './lib/storage.js';
import { setRoute, useHashRoute } from './lib/useHashRoute.js';

const navigation = [
  { route: 'positions', title: 'Positions', description: 'View weekly instrument positions', icon: 'chevRight' },
  { route: 'setlist', title: 'Setlist', description: 'View songs for the selected week', icon: 'music' },
  { route: 'chat', title: 'Chat', description: 'Post casual messages', icon: 'chat' },
  { route: 'password', title: '비밀번호 변경', icon: 'edit' },
  { route: 'admin', title: '관리자', icon: 'menu' },
];

function StatusPage({ message, canLogout = false }) {
  return (
    <main className="loginShell">
      <section className="card loginCard formStack">
        <div className="brand"><div className="brandMark">Z</div><strong>Zamar</strong></div>
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
    <section className="card scrollCard">
      <div className="cardHead"><h2>주차 추가</h2><button className="ghostBtn" type="button" onClick={onClose} disabled={busy}>닫기</button></div>
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
  const { team, weeks, error } = useTeam();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedSunday, setSelectedSunday] = useState(null);
  const [now, setNow] = useState(() => new Date());
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

  function navigate(next) {
    setRoute(next);
    setDrawerOpen(false);
    setEditor(null);
  }

  function selectWeek(index) {
    if (!weeks?.[index]) return;
    setSelectedSunday(weeks[index].sunday);
    setEditor(null);
  }

  function openEditor(type) {
    setEditor({ type, route, sunday: week?.sunday });
  }

  function finishedWeek(sunday) {
    setSelectedSunday(sunday);
    setEditor(null);
    setToast('새 주차를 추가했습니다.');
  }

  const subtitle = route === 'positions' ? 'Sunday Positions' : navigation.find((item) => item.route === route)?.title;

  return (
    <div className="app">
      <Topbar teamName={team?.teamName ?? 'zamar'} subtitle={subtitle} onHome={() => navigate('positions')} onOpenMenu={() => setDrawerOpen(true)} />
      <main className="content" style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        {error && <p className="formError" role="alert">{error}</p>}
        {(!team || !weeks) && !error && <p className="weekHint" role="status">주차 정보를 불러오는 중…</p>}

        {team && weeks && route === 'positions' && !activeEditor && (
          <PositionsPage
            week={week}
            weekIndex={weekIndex}
            weeksCount={weeks.length}
            weeks={weeks}
            result={result}
            onPrevWeek={() => selectWeek(weekIndex - 1)}
            onNextWeek={() => selectWeek(weekIndex + 1)}
            onSelectWeek={selectWeek}
            onEdit={admin && week ? () => openEditor('edit') : null}
            onAdd={admin ? () => openEditor('new') : null}
          />
        )}
        {team && weeks && route === 'setlist' && !activeEditor && (
          <SetlistPage key={week?.sunday} week={week} result={result} onEdit={admin ? () => openEditor('edit') : null} />
        )}
        {activeEditor === 'edit' && <WeekEditor key={route + week.sunday} sunday={week.sunday} kind={kind} onClose={() => setEditor(null)} onSaved={setToast} />}
        {activeEditor === 'new' && <NewWeekForm initialDate={upcomingSunday(now, team?.timezone)} onCreated={finishedWeek} onClose={() => setEditor(null)} />}

        {team && weeks && route === 'chat' && (week ? <ChatPage key={week.sunday} week={week} onToast={setToast} /> : <p className="weekHint">등록된 주차가 없습니다.</p>)}
        {route === 'password' && <PasswordPage onToast={setToast} />}
        {team && route === 'admin' && <AdminPage team={team} onToast={setToast} />}
      </main>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="drawerHead">
          <div><div className="drawerTitle">Menu</div><div className="weekHint">{profile.name}</div></div>
          <button className="iconBtn" onClick={() => setDrawerOpen(false)} aria-label="Close menu" type="button"><span className="x">×</span></button>
        </div>
        <div className="drawerBody">
          {navigation.filter((item) => item.route !== 'admin' || admin).map((item) => (
            <button className={'menuBtn' + (route === item.route ? ' active' : '')} onClick={() => navigate(item.route)} type="button" key={item.route}>
              <span className="menuIcon"><Icon name={item.icon} /></span>
              <div><div className="menuTitle">{item.title}</div>{item.description && <div className="menuDesc">{item.description}</div>}</div>
            </button>
          ))}
          <button className="ghostBtn" type="button" onClick={() => signOut(auth)}>로그아웃</button>
        </div>
      </Drawer>
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}

export default function App() {
  if (!firebaseReady) return <StatusPage message="Firebase 연결 설정이 필요합니다. 개발자 또는 관리자에게 문의해 주세요." />;
  return <AuthenticatedApp />;
}

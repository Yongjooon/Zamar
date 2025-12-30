import React, { useMemo, useState } from 'react';
import './App.css';

import Topbar from './components/Topbar.jsx';
import Drawer from './components/Drawer.jsx';
import Icon from './components/Icon.jsx';
import Toast from './components/Toast.jsx';

import PositionsPage from './pages/PositionsPage.jsx';
import SetlistPage from './pages/SetlistPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

import { findCurrentWeekIndex } from './lib/date.js';
import { loadData } from './lib/storage.js';
import { setRoute, useHashRoute } from './lib/useHashRoute.js';

export default function App() {
  const route = useHashRoute();
  const [data] = useState(() => loadData());
  const weeks = data.weeks;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState('');

  // 초기 weekIndex는 data 로드 시 한번 계산
  const [weekIndex, setWeekIndex] = useState(() => findCurrentWeekIndex(weeks));

  // ✅ effect로 weekIndex를 “맞추는” 대신, 렌더 단계에서 안전한 index를 계산해서 사용
  // (weeks 길이가 변해도 setState를 강제로 호출하지 않음)
  const safeWeekIndex = useMemo(() => {
    const max = Math.max(weeks.length - 1, 0);
    return Math.min(Math.max(weekIndex, 0), max);
  }, [weekIndex, weeks.length]);

  const week = weeks[safeWeekIndex];

  function navigate(next) {
    setRoute(next);
    setDrawerOpen(false);
  }

  function goPrevWeek() {
    setWeekIndex((i) => Math.max(0, i - 1));
  }

  function goNextWeek() {
    setWeekIndex((i) => Math.min(weeks.length - 1, i + 1));
  }

  function selectWeek(index) {
    const max = Math.max(weeks.length - 1, 0);
    setWeekIndex(Math.min(Math.max(index, 0), max));
  }

  const subtitle = useMemo(() => {
    if (route === 'positions') return 'Sunday Positions';
    if (route === 'setlist') return 'Setlist';
    return 'Chat';
  }, [route]);

  return (
    <div className="app">
      <Topbar
        teamName={data.teamName}
        subtitle={subtitle}
        onHome={() => setRoute('positions')}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      <main className="content">
        {route === 'positions' && (
          <PositionsPage
            week={week}
            weekIndex={safeWeekIndex}
            weeksCount={weeks.length}
            weeks={weeks}
            onPrevWeek={goPrevWeek}
            onNextWeek={goNextWeek}
            onSelectWeek={selectWeek}
          />
        )}

        {route === 'setlist' && <SetlistPage week={week} />}

        {route === 'chat' && <ChatPage week={week} onToast={setToast} />}
      </main>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="drawerHead">
          <div className="drawerTitle">Menu</div>
          <button className="iconBtn" onClick={() => setDrawerOpen(false)} aria-label="Close menu" type="button">
            <span className="x">×</span>
          </button>
        </div>

        <div className="drawerBody">
          <button
            className={`menuBtn ${route === 'positions' ? 'active' : ''}`}
            onClick={() => navigate('positions')}
            type="button"
          >
            <span className="menuIcon">
              <Icon name="chevRight" />
            </span>
            <div>
              <div className="menuTitle">Positions</div>
              <div className="menuDesc">View weekly instrument positions</div>
            </div>
          </button>

          <button
            className={`menuBtn ${route === 'setlist' ? 'active' : ''}`}
            onClick={() => navigate('setlist')}
            type="button"
          >
            <span className="menuIcon">
              <Icon name="music" />
            </span>
            <div>
              <div className="menuTitle">Setlist</div>
              <div className="menuDesc">View songs for the selected week</div>
            </div>
          </button>

          <button
            className={`menuBtn ${route === 'chat' ? 'active' : ''}`}
            onClick={() => navigate('chat')}
            type="button"
          >
            <span className="menuIcon">
              <Icon name="chat" />
            </span>
            <div>
              <div className="menuTitle">Chat</div>
              <div className="menuDesc">Post casual messages</div>
            </div>
          </button>
        </div>
      </Drawer>

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}

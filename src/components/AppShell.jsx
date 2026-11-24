import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';

const primaryLinks = [
  { route: 'positions', href: '#/', title: '포지션', icon: 'positions' },
  { route: 'setlist', href: '#/setlist', title: 'Setlist', icon: 'music' },
  { route: 'board', href: '#/board', title: '익명 게시판', icon: 'chat' },
];

function NavigationLinks({ route, links, onNavigate }) {
  return links.map((item) => (
    <a key={item.route} className="navLink" href={item.href}
      aria-current={route === item.route ? 'page' : undefined} onClick={onNavigate}>
      <Icon name={item.icon} />
      <span>{item.title}</span>
    </a>
  ));
}

export default function AppShell({ teamName, profile, route, theme, onToggleTheme, onNavigate, onLogout, children }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const brandClicks = useRef(0);
  const accountLinks = [
    { route: 'password', href: '#/password', title: '비밀번호 변경', icon: 'lock' },
    ...(profile.role === 'admin' ? [
      { route: 'admin', href: '#/admin', title: '관리자', icon: 'settings' },
    ] : []),
  ];

  function navigate() {
    setAccountOpen(false);
    onNavigate();
  }

  function clickBrand(event) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    brandClicks.current += 1;
    if (brandClicks.current === 10) {
      event.preventDefault();
      brandClicks.current = 0;
      window.location.hash = '#/escape';
    }
    navigate();
  }

  return (
    <div className="app">
      <a className="skipLink" href="#main-content" onClick={(event) => {
        event.preventDefault();
        document.getElementById('main-content')?.focus();
      }}>본문으로 이동</a>
      <header className="workspaceRail">
        <a className="brand" href="#/" aria-label={teamName + ' 홈'} onClick={clickBrand}>
          <span className="brandMark" aria-hidden="true">Z<span>.</span></span>
          <span className="brandText">{teamName}</span>
        </a>

        <nav className="desktopNav" aria-label="주 메뉴">
          <NavigationLinks route={route} links={primaryLinks} onNavigate={navigate} />
        </nav>

        <button className="profileButton" type="button" aria-label="내 계정" aria-haspopup="dialog"
          onClick={() => setAccountOpen(true)}>
          <span className="profileIcon"><Icon name="user" /></span>
          <span className="profileText"><strong>{profile.name}</strong><small>내 계정</small></span>
          <span className="profileChevron"><Icon name="chevRight" /></span>
        </button>
      </header>

      <main id="main-content" className={'content content--' + route} tabIndex={-1}>{children}</main>

      <nav className="mobileNav" aria-label="주 메뉴">
        <NavigationLinks route={route} links={primaryLinks} onNavigate={navigate} />
      </nav>

      {accountOpen && (
        <Modal title="내 계정" onClose={() => setAccountOpen(false)}>
          <div className="accountSummary">
            <span className="profileIcon"><Icon name="user" /></span>
            <strong>{profile.name}</strong>
          </div>
          <div className="themeSetting">
            <span id="dark-mode-label">다크모드</span>
            <button className="themeSwitch" type="button" role="switch" aria-checked={theme === 'dark'}
              aria-labelledby="dark-mode-label" onClick={onToggleTheme}>
              <span className="themeSwitchTrack" aria-hidden="true"><span /></span>
            </button>
          </div>
          <nav className="accountLinks" aria-label="계정 메뉴">
            <NavigationLinks route={route} links={accountLinks} onNavigate={navigate} />
          </nav>
          <div className="accountFooter">
            <button className="ghostBtn" type="button" onClick={onLogout}><Icon name="logout" />로그아웃</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

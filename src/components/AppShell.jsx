import { useState } from 'react';
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

export default function AppShell({ teamName, profile, route, onNavigate, onLogout, children }) {
  const [accountOpen, setAccountOpen] = useState(false);
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

  return (
    <div className="app">
      <a className="skipLink" href="#main-content" onClick={(event) => {
        event.preventDefault();
        document.getElementById('main-content')?.focus();
      }}>본문으로 이동</a>
      <header className="workspaceRail">
        <a className="brand" href="#/" aria-label={teamName + ' 홈'} onClick={navigate}>
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

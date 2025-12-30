import React from 'react';
import Icon from './Icon.jsx';

export default function Topbar({ teamName, subtitle, onHome, onOpenMenu }) {
  return (
    <header className="topbar">
      <div className="topbarInner">
        <button
          className="brand brandBtn"
          onClick={onHome}
          type="button"
          aria-label="Go to positions"
        >
          <div className="brandMark">Z</div>
          <div className="brandText">
            <div className="brandTitle">{teamName}</div>
            <div className="brandSub">{subtitle}</div>
          </div>
        </button>

        <button className="iconBtn" onClick={onOpenMenu} aria-label="Open menu" type="button">
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}

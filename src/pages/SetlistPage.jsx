import React from 'react';
import Icon from '../components/Icon.jsx';
import { formatSundayLabel } from '../lib/date.js';

export default function SetlistPage({ week }) {
  return (
    <section className="card">
      <div className="cardHead">
        <div>
          <div className="weekLabel">{week ? formatSundayLabel(week.sunday) : '-'}</div>
          <div className="weekHint">Songs for the selected week (to be implemented).</div>
        </div>
      </div>

      <div className="empty">
        <div className="emptyIcon"><Icon name="music" /></div>
        <div className="emptyTitle">Setlist (coming soon)</div>
        <div className="emptyText">Later, you can show song title, key, tempo, and notes for this week.</div>
      </div>
    </section>
  );
}

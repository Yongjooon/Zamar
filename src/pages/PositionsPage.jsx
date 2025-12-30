import React, { useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { formatSundayLabel } from '../lib/date.js';

export default function PositionsPage({
  week,
  weekIndex,
  weeksCount,
  weeks,
  onPrevWeek,
  onNextWeek,
  onSelectWeek,
}) {
  const positions = useMemo(() => (week ? [...week.positions] : []), [week]);
  const [pickerOpen, setPickerOpen] = useState(false);

  /* =========================================================
     ✅ Page transition (book-like slide)
  ========================================================= */
  const [animDir, setAnimDir] = useState(null); // 'next' | 'prev' | null
  const animLock = useRef(false);

  function animate(dir, action) {
    if (animLock.current) return;
    animLock.current = true;
    setAnimDir(dir);

    // halfway → change data
    setTimeout(() => {
      action();
    }, 160);

    // end animation
    setTimeout(() => {
      setAnimDir(null);
      animLock.current = false;
    }, 320);
  }

  /* =========================================================
     ✅ Swipe state
  ========================================================= */
  const touchStart = useRef({ x: 0, y: 0 });
  const swiping = useRef(false);

  function onTouchStart(e) {
    if (pickerOpen || animLock.current) return;
    const t = e.touches?.[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
    swiping.current = false;
  }

  function onTouchMove(e) {
    if (pickerOpen || animLock.current) return;
    const t = e.touches?.[0];
    if (!t) return;

    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      swiping.current = true;
    }
  }

  function onTouchEnd(e) {
    if (pickerOpen || animLock.current) return;
    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (!swiping.current) return;
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0 && weekIndex < weeksCount - 1) {
      animate('next', onNextWeek);
    } else if (dx > 0 && weekIndex > 0) {
      animate('prev', onPrevWeek);
    }
  }

  /* =========================================================
     ✅ animation style (CSS 추가 없음)
     - translate + scale + opacity 조합으로 page-turn 느낌 강화
  ========================================================= */
  const slideStyle =
    animDir === 'next'
      ? { transform: 'translateX(-26px) scale(0.985)', opacity: 0 }
      : animDir === 'prev'
      ? { transform: 'translateX(26px) scale(0.985)', opacity: 0 }
      : { transform: 'translateX(0) scale(1)', opacity: 1 };

  return (
    <section
      className="card"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        touchAction: 'pan-y',
        transition: 'transform 320ms ease, opacity 240ms ease',
        willChange: 'transform, opacity',
        ...slideStyle,
      }}
    >
      {/* ================= Header ================= */}
      <div className="cardHead">
        <div>
          <button
            type="button"
            className="weekLabel weekLabelBtn"
            onClick={() => setPickerOpen(true)}
          >
            {week ? formatSundayLabel(week.sunday) : '-'}
            <span className="weekLabelChevron" aria-hidden>
              <Icon name="chevRight" />
            </span>
          </button>
          <div className="weekHint">Tap the date to pick a week.</div>
        </div>

        <div className="weekNav">
          <button
            className="pillBtn"
            disabled={weekIndex === 0}
            onClick={() => animate('prev', onPrevWeek)}
            type="button"
            aria-label="Previous week"
          >
            <Icon name="chevLeft" />
          </button>
          <button
            className="pillBtn"
            disabled={weekIndex === weeksCount - 1}
            onClick={() => animate('next', onNextWeek)}
            type="button"
            aria-label="Next week"
          >
            <Icon name="chevRight" />
          </button>
        </div>
      </div>

      {/* ================= Positions ================= */}
      <div className="list" aria-label="Positions list">
        {positions.map((p) => {
          const people =
            Array.isArray(p.people) && p.people.length > 0
              ? p.people.join(' · ')
              : p.person ?? '-';

          return (
            <div key={p.role} className="row">
              <div className="role">
                <div className="roleName">{p.role}</div>
              </div>
              <div className="person">
                <div className="personName">{people}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= Week Picker ================= */}
      <div
        className={`pickerBackdrop ${pickerOpen ? 'open' : ''}`}
        onClick={() => setPickerOpen(false)}
      />
      <div
        className={`pickerSheet ${pickerOpen ? 'open' : ''}`}
        role="dialog"
        aria-hidden={!pickerOpen}
      >
        <div className="pickerHead">
          <div>
            <div className="pickerTitle">Select Sunday</div>
            <div className="pickerSub">Choose a week to view positions.</div>
          </div>
          <button className="iconBtn" onClick={() => setPickerOpen(false)} type="button" aria-label="Close">
            <span className="x">×</span>
          </button>
        </div>

        <div className="pickerList" aria-label="Week list">
          {weeks.map((w, idx) => (
            <button
              key={w.sunday}
              type="button"
              className={`pickerItem ${idx === weekIndex ? 'active' : ''}`}
              onClick={() => {
                onSelectWeek(idx);
                setPickerOpen(false);
              }}
            >
              <div className="pickerItemTitle">{formatSundayLabel(w.sunday)}</div>
              <div className="pickerItemMeta">{w.positions?.length ?? 0} positions</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

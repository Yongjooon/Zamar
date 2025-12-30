// src/pages/PositionsPage.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
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

    setTimeout(() => {
      action();
    }, 160);

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

    // ✅ horizontal swipe만 인식 (vertical scroll과 충돌 최소화)
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

  const slideStyle =
    animDir === 'next'
      ? { transform: 'translateX(-20px)', opacity: 0 }
      : animDir === 'prev'
      ? { transform: 'translateX(20px)', opacity: 0 }
      : { transform: 'translateX(0)', opacity: 1 };

  /* =========================================================
     ✅ 핵심 수정사항
     - card 바깥(페이지/앱)은 스크롤이 내려가지 않게 해야 함
     - list 영역만 내부 스크롤
     - iOS에서 body overflow hidden일 때도 list 스크롤이 안정적으로 동작하도록:
       1) card에 maxHeight + flex column
       2) list에 minHeight:0 + overflowY:auto
       3) picker/drawer 열렸을 때 body 스크롤 잠금(중복 안전)
  ========================================================= */

  // ✅ Topbar + content padding 등을 고려한 카드 최대 높이
  const cardMaxH = 'calc(100dvh - 140px - env(safe-area-inset-bottom))';

  // ✅ (선택) picker 열릴 때 iOS 바운스/배경 스크롤 전파를 더 확실히 막기 위한 안전장치
  useEffect(() => {
    if (!pickerOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehaviorY;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehaviorY = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehaviorY = prevOverscroll;
    };
  }, [pickerOpen]);

  return (
    <section
      className="card"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        // ✅ vertical scroll은 list에만, card 자체는 화면에 고정
        touchAction: 'pan-y',
        transition: 'transform 320ms ease, opacity 260ms ease',
        ...slideStyle,

        // ✅ 카드 높이/레이아웃을 flex로 고정
        maxHeight: cardMaxH,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // ⭐ list 스크롤을 위해 필수
      }}
    >
      {/* ================= Header (고정) ================= */}
      <div className="cardHead" style={{ flex: '0 0 auto' }}>
        <div>
          <button
            type="button"
            className="weekLabel weekLabelBtn"
            onClick={() => setPickerOpen(true)}
          >
            {week ? formatSundayLabel(week.sunday) : '-'}
            <span className="weekLabelChevron">
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
          >
            <Icon name="chevLeft" />
          </button>
          <button
            className="pillBtn"
            disabled={weekIndex === weeksCount - 1}
            onClick={() => animate('next', onNextWeek)}
            type="button"
          >
            <Icon name="chevRight" />
          </button>
        </div>
      </div>

      {/* ================= List (여기만 스크롤) ================= */}
      <div
        className="list"
        style={{
          flex: '1 1 auto',
          minHeight: 0, // ⭐ iOS/Safari에서 내부 스크롤 안정화
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain', // ✅ 바깥(앱)으로 스크롤 체인 전파 방지
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        }}
      >
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
      <div className={`pickerSheet ${pickerOpen ? 'open' : ''}`}>
        <div className="pickerHead">
          <div>
            <div className="pickerTitle">Select Sunday</div>
            <div className="pickerSub">Choose a week to view positions.</div>
          </div>
          <button className="iconBtn" onClick={() => setPickerOpen(false)} type="button">
            <span className="x">×</span>
          </button>
        </div>

        <div className="pickerList">
          {weeks.map((w, idx) => (
            <button
              key={w.sunday}
              className={`pickerItem ${idx === weekIndex ? 'active' : ''}`}
              onClick={() => {
                onSelectWeek(idx);
                setPickerOpen(false);
              }}
              type="button"
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

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

  // ✅ swipe state (touch)
  const touchStart = useRef({ x: 0, y: 0, t: 0 });
  const swiping = useRef(false);

  function onTouchStart(e) {
    if (pickerOpen) return; // picker 열려있을 땐 스와이프 무시
    const t = e.touches?.[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    swiping.current = false;
  }

  function onTouchMove(e) {
    if (pickerOpen) return;
    const t = e.touches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    // 수평 이동이 더 크면 스와이프로 간주 (세로 스크롤 오작동 방지)
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      swiping.current = true;
    }
  }

  function onTouchEnd(e) {
    if (pickerOpen) return;
    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    // 실제로 수평 스와이프가 아니면 종료
    if (!swiping.current) return;
    if (Math.abs(dx) < 50) return; // threshold
    if (Math.abs(dx) < Math.abs(dy)) return;

    // dx < 0: 왼쪽 스와이프 -> 다음 주
    if (dx < 0) onNextWeek();
    // dx > 0: 오른쪽 스와이프 -> 이전 주
    else onPrevWeek();
  }

  return (
    <section
      className="card"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }} // ✅ 세로 제스처는 기본 동작 유지, 가로 스와이프만 감지
    >
      <div className="cardHead">
        <div>
          <button
            type="button"
            className="weekLabel weekLabelBtn"
            onClick={() => setPickerOpen(true)}
            aria-label="Select a Sunday"
          >
            {week ? formatSundayLabel(week.sunday) : '-'}
            <span className="weekLabelChevron" aria-hidden>
              <Icon name="chevRight" />
            </span>
          </button>
          <div className="weekHint">Tap the date to pick a week.</div>
        </div>

        <div className="weekNav">
          <button className="pillBtn" onClick={onPrevWeek} disabled={weekIndex === 0} aria-label="Previous week">
            <Icon name="chevLeft" />
          </button>
          <button
            className="pillBtn"
            onClick={onNextWeek}
            disabled={weekIndex === weeksCount - 1}
            aria-label="Next week"
          >
            <Icon name="chevRight" />
          </button>
        </div>
      </div>

      <div className="list" aria-label="Positions list">
        {positions.map((p) => {
          // ✅ person / people 둘 다 지원
          const people =
            Array.isArray(p.people) && p.people.length > 0
              ? p.people.join(' · ')
              : (p.person ?? '');

          return (
            <div key={p.role} className="row">
              <div className="role">
                <div className="roleName">{p.role}</div>
              </div>
              <div className="person">
                <div className="personName">{people || '-'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Picker (bottom sheet) */}
      <div className={`pickerBackdrop ${pickerOpen ? 'open' : ''}`} onClick={() => setPickerOpen(false)} />
      <div className={`pickerSheet ${pickerOpen ? 'open' : ''}`} role="dialog" aria-hidden={!pickerOpen}>
        <div className="pickerHead">
          <div>
            <div className="pickerTitle">Select Sunday</div>
            <div className="pickerSub">Choose a week to view positions.</div>
          </div>
          <button className="iconBtn" onClick={() => setPickerOpen(false)} aria-label="Close week picker" type="button">
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

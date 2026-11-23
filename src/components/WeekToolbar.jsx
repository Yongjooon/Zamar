import { useEffect, useRef, useState } from 'react';
import { formatSundayLabel } from '../lib/date.js';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';

function WeekPicker({ weeks, weekIndex, onSelect, onClose }) {
  const current = useRef(null);
  useEffect(() => {
    current.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (
    <Modal title="주차 선택" className="weekDialog" onClose={onClose}>
      <div className="weekOptions">
        {weeks.map((week, index) => (
          <button key={week.sunday} ref={index === weekIndex ? current : null}
            className="weekOption" aria-current={index === weekIndex ? 'date' : undefined} type="button"
            onClick={() => { onSelect(index); onClose(); }}>
            <span>{formatSundayLabel(week.sunday)}</span>
            {index === weekIndex && <Icon name="check" />}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default function WeekToolbar({ weeks, weekIndex, onSelectWeek, children }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const touch = useRef(null);
  const week = weeks[weekIndex];

  function start(event) {
    touch.current = event.touches.length === 1 && !event.target.closest('button')
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }

  function finish(event) {
    const origin = touch.current;
    touch.current = null;
    if (!origin) return;
    const target = event.changedTouches[0];
    const dx = target.clientX - origin.x;
    const dy = target.clientY - origin.y;
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      onSelectWeek(weekIndex + (dx > 0 ? -1 : 1));
    }
  }

  return (
    <div className="weekControls">
      <div className="weekToolbar" onTouchStart={start} onTouchEnd={finish} onTouchCancel={() => { touch.current = null; }}>
        <div className="dateBlock">
          <span className="dateIcon"><Icon name="calendar" /></span>
          <div>
            <div className="dateCaption">예배 주차</div>
            <button type="button" className="weekLabelBtn" disabled={!week}
              aria-haspopup="dialog" onClick={() => setPickerOpen(true)}>
              {week ? formatSundayLabel(week.sunday) : '등록된 주차 없음'}
              {week && <Icon name="chevDown" />}
            </button>
          </div>
        </div>
        <div className="weekNav">
          <button type="button" className="iconBtn" aria-label="이전 주차"
            disabled={weekIndex <= 0 || !week} onClick={() => onSelectWeek(weekIndex - 1)}><Icon name="chevLeft" /></button>
          <button type="button" className="iconBtn" aria-label="다음 주차"
            disabled={weekIndex >= weeks.length - 1 || !week} onClick={() => onSelectWeek(weekIndex + 1)}><Icon name="chevRight" /></button>
        </div>
      </div>
      {children && <div className="actionRow weekActions">{children}</div>}
      {pickerOpen && <WeekPicker weeks={weeks} weekIndex={weekIndex} onSelect={onSelectWeek} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

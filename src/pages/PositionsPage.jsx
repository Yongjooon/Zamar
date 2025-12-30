import React, { useMemo, useState } from 'react';
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

  return (
    <section className="card">
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
          <button
            className="pillBtn"
            onClick={onPrevWeek}
            disabled={weekIndex === 0}
            aria-label="Previous week"
          >
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

      {/* ✅ Positions list */}
      <div className="list" aria-label="Positions list">
        {positions.map((p) => {
          const people =
            Array.isArray(p.people) && p.people.length > 0
              ? p.people.join(' · ')
              : p.person || '-';

          return (
            <div key={p.role} className="row">
              <div className="role">
                <div className="roleName">{p.role}</div>
              </div>

              <div className="person multi">
                <div className="personName">{people}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Picker (bottom sheet) */}
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
          <button
            className="iconBtn"
            onClick={() => setPickerOpen(false)}
            aria-label="Close week picker"
            type="button"
          >
            <span className="x">×</span>
          </button>
        </div>

        <div className="pickerList">
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
              <div className="pickerItemTitle">
                {formatSundayLabel(w.sunday)}
              </div>
              <div className="pickerItemMeta">
                {w.positions?.length ?? 0} positions
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

import { TEAM_TIME_ZONE } from '../../shared/team.js';

export function formatSundayLabel(isoSunday) {
  return isoSunday.replaceAll('-', '.') + ' (일)';
}

export function upcomingSunday(date = new Date(), timeZone = TEAM_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const day = new Date(fields.year + '-' + fields.month + '-' + fields.day + 'T00:00:00Z');
  day.setUTCDate(day.getUTCDate() + (7 - day.getUTCDay()) % 7);
  return day.toISOString().slice(0, 10);
}

export function findCurrentWeekIndex(weeks, timeZone = TEAM_TIME_ZONE, now = new Date()) {
  const index = weeks.findIndex(({ sunday }) => sunday >= upcomingSunday(now, timeZone));
  return index >= 0 ? index : Math.max(weeks.length - 1, 0);
}

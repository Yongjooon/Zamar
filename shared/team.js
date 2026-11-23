export const TEAM_NAME = 'zamar';
export const TEAM_TIME_ZONE = 'Asia/Seoul';
export const POSITION_ROLES = [
  '인도자', '싱어', '피아노', '드럼', '신디', '일렉',
  '베이스', '어쿠스틱', 'ppt', '엔지니어', '회중',
];
export const MAX_ENTRIES = 30;
export const MAX_ASSIGNEES = 30;

export function isSunday(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return date.getUTCDay() === 0 && date.toISOString().slice(0, 10) === value;
}

export function isTimeZone(value) {
  if (typeof value !== 'string' || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

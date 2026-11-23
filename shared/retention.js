const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function weekRetentionCutoff(now = new Date()) {
  const local = new Date(now.getTime() + SEOUL_OFFSET_MS);
  const year = local.getUTCFullYear() - 1;
  const month = local.getUTCMonth();
  const day = Math.min(local.getUTCDate(), daysInMonth(year, month));
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function postExpiration(createdAt) {
  const local = new Date(createdAt.getTime() + SEOUL_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth() + 1;
  const day = Math.min(local.getUTCDate(), daysInMonth(year, month));
  return new Date(Date.UTC(year, month, day, local.getUTCHours(), local.getUTCMinutes(),
    local.getUTCSeconds(), local.getUTCMilliseconds()) - SEOUL_OFFSET_MS);
}

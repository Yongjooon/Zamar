export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function toISODate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Sunday-based week start (returns the Sunday of the current week)
export function startOfSundayWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * ✅ Upcoming Sunday rule:
 * - If today is Sunday => today
 * - Mon..Sat => next Sunday
 *
 * This matches: 2025-12-30(Tue) => 2026-01-04(Sun)
 */
export function upcomingSunday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const add = (7 - day) % 7; // Sun=0, Mon=6, Tue=5, ... Sat=1
  d.setDate(d.getDate() + add);
  return d;
}

export function formatSundayLabel(isoSunday) {
  const d = parseISODate(isoSunday);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} (Sun)`;
}

/**
 * ✅ Finds week index based on "upcoming Sunday".
 * Priority:
 * 1) exact sunday match
 * 2) closest future sunday (>= target)
 * 3) fallback to last
 */
export function findCurrentWeekIndex(weeks) {
  if (!Array.isArray(weeks) || weeks.length === 0) return 0;

  const targetISO = toISODate(upcomingSunday(new Date()));

  // 1) exact match
  const exact = weeks.findIndex((w) => w?.sunday === targetISO);
  if (exact !== -1) return exact;

  // 2) closest future
  const targetTime = parseISODate(targetISO).getTime();
  let bestIdx = -1;
  let bestDiff = Infinity;

  for (let i = 0; i < weeks.length; i++) {
    const s = weeks[i]?.sunday;
    if (!s) continue;
    const t = parseISODate(s).getTime();
    if (t >= targetTime) {
      const diff = t - targetTime;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
  }

  if (bestIdx !== -1) return bestIdx;

  // 3) fallback: last
  return Math.max(weeks.length - 1, 0);
}

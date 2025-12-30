export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Sunday-based week start
export function startOfSundayWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatSundayLabel(isoSunday) {
  const d = parseISODate(isoSunday);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} (Sun)`;
}

export function findCurrentWeekIndex(weeks) {
  const iso = toISODate(startOfSundayWeek(new Date()));
  const exact = weeks.findIndex((w) => w.sunday === iso);
  if (exact !== -1) return exact;
  // nearest past week, else 0
  let best = weeks[0]?.sunday;
  for (const w of weeks) if (w.sunday <= iso) best = w.sunday;
  const idx = weeks.findIndex((w) => w.sunday === best);
  return idx === -1 ? 0 : idx;
}

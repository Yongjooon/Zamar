const paths = {
  positions: 'M8 5H5v14h14V5h-3M9 4h6v3H9zM9 11h6m-6 4h6',
  music: 'M9 17V6l12-2v11M9 17a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z',
  chat: 'M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-5a7.5 7.5 0 0 1 6.5-11.3h2a7.5 7.5 0 0 1 7.5 6.8ZM8 12h8',
  calendar: 'M5 6h14a1 1 0 0 1 1 1v12H4V7a1 1 0 0 1 1-1Zm-1 4h16M8 4v4m8-4v4m-7 7h.01m3 0h.01m3 0h.01',
  mic: 'M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0Zm-3 5a6 6 0 0 0 12 0m-6 6v4m-3 0h6',
  user: 'M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 7v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1',
  lock: 'M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6zm6 4v2',
  settings: 'M4 7h16M4 12h16M4 17h16M9 5v4m6 1v4m-5 1v4',
  logout: 'M11 5H5v14h6m-1-7h10m-4-4 4 4-4 4',
  edit: 'm5 16 10-10a2 2 0 0 1 3 3L8 19H5zm8-8 3 3',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  check: 'm5 12 4 4L19 6',
  chevLeft: 'm15 6-6 6 6 6',
  chevRight: 'm9 6 6 6-6 6',
  chevDown: 'm6 9 6 6 6-6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13m-8 4v5m4-5v5',
  refresh: 'M19.5 11a7.5 7.5 0 0 0-13-5L4 8m0-4v4h4m-3.5 5a7.5 7.5 0 0 0 13 5L20 16m0 4v-4h-4',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v5l3 2',
  play: 'M8 5.5v13l11-6.5z',
  external: 'M13 5h6v6m0-6-8 8m8 1v5H5V5h5',
};

export default function Icon({ name }) {
  const path = paths[name];
  if (!path) return null;

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

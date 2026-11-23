const paths = {
  positions: 'M8 5H5v14h14V5h-3M9 4h6v3H9zM9 11h6m-6 4h6',
  music: 'M9 17V6l12-2v11M9 17a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z',
  chat: 'M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-5a7.5 7.5 0 0 1 6.5-11.3h2a7.5 7.5 0 0 1 7.5 6.8ZM8 12h8',
  calendar: 'M5 6h14a1 1 0 0 1 1 1v12H4V7a1 1 0 0 1 1-1Zm-1 4h16M8 4v4m8-4v4m-7 7h.01m3 0h.01m3 0h.01',
  mic: 'M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0Zm-3 5a6 6 0 0 0 12 0m-6 6v4m-3 0h6',
  conductor: 'M12 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM9 20v-8l-4 2-2-4m12 10v-8l4-2V7m0 0 3-4',
  piano: 'M3 5h18v14H3zM7 5v7h2V5m3 0v7h2V5m3 0v7h2V5M8 12v7m5-7v7m5-7v7',
  synth: 'M3 5h18v14H3zm0 5h18M6 7.5h.01M9 7.5h.01M15 7.5h3M7.5 10v9m4.5-9v9m4.5-9v9',
  drum: 'M4 12a8 3 0 1 0 16 0 8 3 0 1 0-16 0Zm0 0v6a8 3 0 0 0 16 0v-6M7 15v4m5-4v6m5-6v4M4 3l6 5m10-5-6 5',
  electricGuitar: 'm15 8 4-5 2 2-5 5m-1-2 1 2m0 0 1.2 1.5c1.2 1.7-.8 3.9-2.5 2.9-.4 2.8-2 5.6-5 6.2a5 5 0 0 1-2.8-9.4c1.6-.6 2.7-1.5 3.1-3l.4-1.2 2.4 2.1L15 8m-2 3-4 4m-.5-1.5 2 2',
  bass: 'm12 10 6-6 2 2-6 6m4-8 1-2m1 4 2-2m-8 8 1 1.4a3 3 0 0 1-2.6 4.7 5.5 5.5 0 0 1-8.1 2.1 4.6 4.6 0 0 1 1.1-7.6c1-.5 1.4-1.7 1.3-2.8l3.4 1.8 1.9-1.6m.5 3-4 4m-1-2 2 2',
  acousticGuitar: 'm13 8 5-5 3 3-5 5m-3-3 3 3m0 0c2.6 3.4-1 5.5-3 5.5a5 5 0 1 1-6-6 3.5 3.5 0 0 1 6-2.5m-1 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-5 4 2 2',
  mixer: 'M4 4h16v16H4zm4 3v3m0 3v4m4-10v6m0 3v1m4-10v1m0 3v6M6.5 10h3v3h-3zm4 3h3v3h-3zm4-5h3v3h-3z',
  presentation: 'M3 4h18v13H3zm9 13v4m-3 0h6M7 13l3-3 2 2 4-4m-1 0h2v2',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 8v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1m1-8a3 3 0 1 0 0-6m2 9a4 4 0 0 1 3 4v1',
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

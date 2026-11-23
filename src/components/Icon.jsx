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
  electricGuitar: 'M10 1.8h4.4l-.9 3.6v7.8l3.6-3.5v3.2l2 2.8v3.1l-2.8 3H7.7l-2.8-3v-3.1l2-2.8V9.7l3.6 3.5V5.4z M10.5 5.4h3 M10 15.7h4m-4 2.6h4',
  bass: 'M10.8 1.4h3.9l-.7 5.2h-.8v8.2c1.1-.3 2.4-1.9 3.7-1.5 1.6.5.3 2.3.4 3.5.1 1 1.2 1.6 1.2 3 0 1.9-2.6 3-6.1 3-3.2 0-5.7-1.1-5.7-3.2 0-1.8 1.4-2.5 1.4-3.8 0-1.2-.9-2.4-.4-3.7.3-.9.9-1.4 1.6-1.8l1.4 3.3v-7z M9.6 2.2h1.2m-1.2 1.4h1.2M9.6 5h1.2m-1.2 1.4h1.1m0 .2h2.5 M10.3 17.4h3.6m-3.6 2.3h3.6',
  acousticGuitar: 'M10.1 1.9h3.8l-.5 3.6v5.6c2.9-.1 4.3 1.2 4.3 3 0 1-.6 1.7-.6 2.5 0 1 1.5 1.8 1.5 3.4 0 2.2-2.8 3-6.6 3s-6.6-.8-6.6-3c0-1.6 1.5-2.4 1.5-3.4 0-.8-.6-1.5-.6-2.5 0-1.8 1.4-3.1 4.3-3V5.5z M10.6 5.5h2.8 M13.8 15.6a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z M10 20h4',
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

const guitarIcons = new Set(['electricGuitar', 'bass', 'acousticGuitar']);

export default function Icon({ name }) {
  const path = paths[name];
  if (!path) return null;
  const guitar = guitarIcons.has(name);

  return (
    <svg className={guitar ? 'guitarIcon' : undefined} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} transform={guitar ? 'rotate(36 12 12)' : undefined} stroke="currentColor"
        strokeWidth={guitar ? 1.5 : 1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

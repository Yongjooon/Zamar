import { useEffect, useState } from 'react';

function normalize(hash) {
  const h = (hash || '').replace(/^#/, '');
  if (h === '' || h === '/') return 'positions';
  if (h.startsWith('/setlist')) return 'setlist';
  if (h.startsWith('/chat')) return 'chat';
  return 'positions';
}

export function setRoute(route) {
  const map = { positions: '#/', setlist: '#/setlist', chat: '#/chat' };
  window.location.hash = map[route] ?? '#/';
}

export function useHashRoute() {
  const [route, setRouteState] = useState(() => normalize(window.location.hash));

  useEffect(() => {
    const onChange = () => setRouteState(normalize(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

import { useEffect, useState } from 'react';

const routes = {
  positions: '#/',
  setlist: '#/setlist',
  chat: '#/chat',
  password: '#/password',
  admin: '#/admin',
};

function currentRoute() {
  return Object.keys(routes).find((route) => routes[route] === window.location.hash) ?? 'positions';
}

export function setRoute(route) {
  window.location.hash = routes[route] ?? routes.positions;
}

export function useHashRoute() {
  const [route, setRouteState] = useState(currentRoute);
  useEffect(() => {
    const onChange = () => setRouteState(currentRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

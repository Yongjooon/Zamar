import { useLayoutEffect, useState } from 'react';

const storageKey = 'zamar.theme';

function savedTheme() {
  try {
    return window.localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useTheme(forceDark = false) {
  const [theme, setTheme] = useState(savedTheme);
  const activeTheme = forceDark ? 'dark' : theme;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', activeTheme === 'dark' ? '#101814' : '#fcfefb',
    );
  }, [activeTheme]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Keep the switch usable when browser storage is unavailable.
    }
  }

  return { theme, toggleTheme };
}

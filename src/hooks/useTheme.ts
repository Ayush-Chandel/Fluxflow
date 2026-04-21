import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
  const stored = localStorage.getItem('theme');
  if (stored && !isTheme(stored)) localStorage.removeItem('theme');
  return (document.documentElement.getAttribute('data-theme') as Theme) ?? 'light';
});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keep in sync if user changes system preference (only when no manual choice exists)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
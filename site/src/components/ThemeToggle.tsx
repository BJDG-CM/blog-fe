import { useEffect, useState } from 'react';

const storageKey = 'blog-theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as 'light' | 'dark' | null;
    const initial = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(storageKey, next);
  };

  return (
    <button type="button" className="secondary" onClick={toggle} aria-label="다크모드 토글">
      {theme === 'light' ? '다크' : '라이트'} 모드
    </button>
  );
}

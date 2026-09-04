import { useCallback, useEffect, useState, type ReactNode } from 'react';

type Mode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'blog-theme';
const ORDER: Mode[] = ['light', 'dark', 'system'];

const LABEL: Record<Mode, string> = {
  light: '라이트 모드',
  dark: '다크 모드',
  system: '시스템 설정',
};

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(mode: Mode) {
  const resolved = mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = resolved;
}

function readStored(): Mode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system'
    ? stored
    : 'system';
}

const ICONS: Record<Mode, ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  system: (
    <>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M8.5 21h7M12 17v4" />
    </>
  ),
};

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readStored();
    setMode(initial);
    setReady(true);
  }, []);

  // 시스템 설정을 따를 때만 OS 테마 변화에 반응한다.
  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  // 뷰 트랜지션으로 문서가 교체되면 html 속성이 초기화되므로 다시 입힌다.
  useEffect(() => {
    const restore = () => apply(readStored());
    document.addEventListener('astro:after-swap', restore);
    return () => document.removeEventListener('astro:after-swap', restore);
  }, []);

  const cycle = useCallback(() => {
    setMode((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={cycle}
      aria-label={`테마 변경 (현재: ${LABEL[mode]})`}
      title={LABEL[mode]}
      suppressHydrationWarning
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity .2s' }}
      >
        {ICONS[mode]}
      </svg>
    </button>
  );
}

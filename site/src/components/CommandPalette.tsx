import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SearchDoc = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  minutes: number;
  body: string;
};

type NavItem = { href: string; label: string };

type Props = {
  items: SearchDoc[];
  nav: NavItem[];
  base: string;
};

type Result = {
  doc: SearchDoc;
  score: number;
  /** 매칭이 일어난 위치 주변 발췌 */
  context: string;
};

const norm = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * 한국어는 형태소 단위로 띄어쓰기가 되지 않는 경우가 많아
 * 토크나이저 대신 정규화된 부분 문자열 매칭 + 필드 가중치로 점수를 낸다.
 */
function scoreDoc(doc: SearchDoc, query: string): Result | null {
  const q = norm(query);
  if (!q) return null;

  const terms = q.split(' ').filter(Boolean);
  const title = norm(doc.title);
  const summary = norm(doc.summary);
  const tags = norm(doc.tags.join(' '));
  const body = norm(doc.body);

  let score = 0;
  let contextIndex = -1;

  for (const term of terms) {
    const inTitle = title.indexOf(term);
    const inTags = tags.indexOf(term);
    const inSummary = summary.indexOf(term);
    const inBody = body.indexOf(term);

    if (inTitle === -1 && inTags === -1 && inSummary === -1 && inBody === -1) {
      return null; // 모든 검색어가 어딘가에는 있어야 한다
    }

    if (inTitle !== -1) score += inTitle === 0 ? 120 : 80;
    if (inTags !== -1) score += 45;
    if (inSummary !== -1) score += 25;
    if (inBody !== -1) {
      score += 10;
      if (contextIndex === -1) contextIndex = inBody;
    }
  }

  const context =
    contextIndex >= 0
      ? `…${doc.body
          .slice(Math.max(0, contextIndex - 32), contextIndex + 90)
          .trim()}…`
      : doc.summary;

  return { doc, score, context };
}

/** 검색어에 해당하는 부분을 <mark> 로 감싼 노드 배열을 만든다. */
function highlight(text: string, query: string) {
  const terms = norm(query).split(' ').filter(Boolean);
  if (terms.length === 0) return text;

  const escaped = terms
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');

  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, index) =>
    terms.includes(norm(part)) ? (
      <mark key={index}>{part}</mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export default function CommandPalette({ items, nav, base }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  // 열기 트리거: ⌘K / Ctrl+K / "/" 그리고 헤더 버튼
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === '/' && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      }
    };

    const onTrigger = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-open-palette]')) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onTrigger);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onTrigger);
    };
  }, [open]);

  // 열려 있는 동안 배경 스크롤을 잠근다.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!query.trim()) {
      return items.slice(0, 6).map((doc) => ({
        doc,
        score: 0,
        context: doc.summary,
      }));
    }
    return items
      .map((doc) => scoreDoc(doc, query))
      .filter((result): result is Result => result !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [items, query]);

  const navResults = useMemo(() => {
    if (!query.trim()) return nav;
    const q = norm(query);
    return nav.filter((item) => norm(item.label).includes(q));
  }, [nav, query]);

  const flat = useMemo(
    () => [
      ...results.map((result) => ({
        key: `post:${result.doc.slug}`,
        href: `${base}posts/${result.doc.slug}`,
      })),
      ...navResults.map((item) => ({
        key: `nav:${item.href}`,
        href: `${base}${item.href}`,
      })),
    ],
    [results, navResults, base],
  );

  useEffect(() => {
    setActive(0);
  }, [query]);

  // 방향키 이동 / 엔터 이동 / ESC 닫기
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((value) => (flat.length ? (value + 1) % flat.length : 0));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((value) =>
          flat.length ? (value - 1 + flat.length) % flat.length : 0,
        );
      } else if (event.key === 'Enter') {
        const target = flat[active];
        if (target) {
          event.preventDefault();
          window.location.href = target.href;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, flat, active, close]);

  // 선택 항목이 보이도록 스크롤
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  return (
    <div
      className="palette-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="사이트 검색"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="palette">
        <div className="palette-input">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="글 제목, 태그, 본문 내용으로 검색…"
            aria-label="검색어"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="kbd">ESC</kbd>
        </div>

        <div className="palette-results" ref={listRef}>
          {flat.length === 0 && (
            <p className="palette-empty">
              “{query}” 와 일치하는 글이 없습니다.
            </p>
          )}

          {results.length > 0 && (
            <>
              <div className="palette-group-label">
                {query.trim() ? '검색 결과' : '최근 글'}
              </div>
              {results.map((result, index) => (
                <a
                  key={result.doc.slug}
                  className="palette-item"
                  href={`${base}posts/${result.doc.slug}`}
                  data-active={active === index}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className="icon" aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16l4 4v13.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5Z" />
                      <path d="M15 3v5h5" />
                    </svg>
                  </span>
                  <span className="text">
                    <span className="title">
                      {highlight(result.doc.title, query)}
                    </span>
                    <span className="sub">
                      {query.trim()
                        ? highlight(result.context, query)
                        : `${result.doc.tags.map((tag) => `#${tag}`).join(' ')} · ${
                            result.doc.minutes
                          }분`}
                    </span>
                  </span>
                </a>
              ))}
            </>
          )}

          {navResults.length > 0 && (
            <>
              <div className="palette-group-label">페이지 이동</div>
              {navResults.map((item, index) => {
                const flatIndex = results.length + index;
                return (
                  <a
                    key={item.href}
                    className="palette-item"
                    href={`${base}${item.href}`}
                    data-active={active === flatIndex}
                    onMouseEnter={() => setActive(flatIndex)}
                  >
                    <span className="icon" aria-hidden="true">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </span>
                    <span className="text">
                      <span className="title">{item.label}</span>
                    </span>
                  </a>
                );
              })}
            </>
          )}
        </div>

        <div className="palette-footer">
          <span>
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> 이동
          </span>
          <span>
            <kbd className="kbd">↵</kbd> 열기
          </span>
          <span>
            <kbd className="kbd">esc</kbd> 닫기
          </span>
        </div>
      </div>
    </div>
  );
}

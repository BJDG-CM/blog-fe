import { useEffect, useMemo, useState, type CSSProperties } from 'react';

export type FilterItem = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  minutes: number;
  gradient: string;
};

type Props = {
  items: FilterItem[];
  tags: Array<{ tag: string; count: number }>;
  base: string;
  /** 초기 선택 태그 (태그 상세 페이지에서 진입할 때) */
  initialTag?: string;
};

type Sort = 'newest' | 'oldest' | 'longest';

const SORT_LABEL: Record<Sort, string> = {
  newest: '최신순',
  oldest: '오래된순',
  longest: '읽는 시간순',
};

const norm = (value: string) => value.toLowerCase().trim();

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export default function PostFilter({
  items,
  tags,
  base,
  initialTag = '',
}: Props) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(initialTag);
  const [sort, setSort] = useState<Sort>('newest');

  // URL 쿼리스트링과 동기화해 필터 상태를 공유·새로고침할 수 있게 한다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const tag = params.get('tag');
    if (q) setQuery(q);
    if (tag && !initialTag) setActiveTag(tag);
  }, [initialTag]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query) params.set('q', query);
    else params.delete('q');

    if (activeTag && !initialTag) params.set('tag', activeTag);
    else params.delete('tag');

    const search = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${search ? `?${search}` : ''}`,
    );
  }, [query, activeTag, initialTag]);

  const filtered = useMemo(() => {
    const q = norm(query);

    const result = items.filter((item) => {
      if (activeTag && !item.tags.some((tag) => tag === activeTag)) return false;
      if (!q) return true;
      return (
        norm(item.title).includes(q) ||
        norm(item.summary).includes(q) ||
        item.tags.some((tag) => norm(tag).includes(q))
      );
    });

    return result.sort((a, b) => {
      if (sort === 'longest') return b.minutes - a.minutes;
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sort === 'oldest' ? diff : -diff;
    });
  }, [items, query, activeTag, sort]);

  const nextSort = () => {
    const order: Sort[] = ['newest', 'oldest', 'longest'];
    setSort((current) => order[(order.indexOf(current) + 1) % order.length]);
  };

  return (
    <>
      <div className="filter-bar">
        <div className="field">
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
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 요약, 태그로 좁혀보기"
            aria-label="글 검색"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="clear"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {!initialTag && tags.length > 0 && (
          <div className="chip-row">
            <button
              type="button"
              className="tag"
              data-active={activeTag === ''}
              onClick={() => setActiveTag('')}
            >
              전체 {items.length}
            </button>
            {tags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                className="tag"
                data-active={activeTag === tag}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              >
                #{tag} {count}
              </button>
            ))}
          </div>
        )}

        <div
          className="chip-row"
          style={{ justifyContent: 'space-between', gap: 12 }}
        >
          <span className="result-count">
            {filtered.length}개의 글
            {activeTag && ` · #${activeTag}`}
          </span>
          <button type="button" className="tag" onClick={nextSort}>
            {SORT_LABEL[sort]}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <strong>조건에 맞는 글이 없습니다.</strong>
          <span>검색어를 줄이거나 태그 선택을 해제해 보세요.</span>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((item, index) => (
            <article
              key={item.slug}
              className="post-card reveal"
              style={
                {
                  '--i': index % 9,
                  '--card-accent': item.gradient,
                } as CSSProperties
              }
            >
              <div className="meta">
                <time dateTime={item.date}>{formatDate(item.date)}</time>
                <span className="dot" aria-hidden="true" />
                <span>{item.minutes}분 읽기</span>
              </div>

              <h3>
                <a href={`${base}posts/${item.slug}`}>{item.title}</a>
              </h3>

              {item.summary && <p>{item.summary}</p>}

              {item.tags.length > 0 && (
                <div className="tags">
                  {item.tags.slice(0, 4).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="tag"
                      onClick={() => setActiveTag(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

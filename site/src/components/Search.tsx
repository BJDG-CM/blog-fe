import { useMemo, useState } from 'react';
import FlexSearch from 'flexsearch';

type SearchItem = {
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
};

const base = import.meta.env.BASE_URL;

export default function Search({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState('');

  const index = useMemo(() => {
    const instance = new FlexSearch.Index({ tokenize: 'forward' });
    items.forEach((item, idx) => {
      instance.add(idx, `${item.title} ${item.summary ?? ''} ${item.tags.join(' ')}`);
    });
    return instance;
  }, [items]);

  const results = useMemo(() => {
    if (!query) return items;
    const ids = index.search(query) as number[];
    return ids.map((id) => items[id]);
  }, [query, index, items]);

  return (
    <section className="card" style={{ marginBottom: '2rem' }}>
      <h2>검색</h2>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="검색어 입력"
        aria-label="검색어 입력"
      />
      <ul>
        {results.map((item) => (
          <li key={item.slug}>
            <a href={`${base}posts/${item.slug}`}>{item.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

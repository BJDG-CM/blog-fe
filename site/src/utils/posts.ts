import DOMPurify from 'isomorphic-dompurify';
import katex from 'katex';
import { renderTiptapToHtml } from './tiptap';
import type { EncryptedPayload } from './crypto';
import { readingTime } from './format';
import { enhanceHtml, type TocEntry } from './render';

export type PostMeta = {
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  draft?: boolean;
  summary?: string;
  cover?: string;
  /** 홈 상단에 크게 노출할 대표 글 */
  featured?: boolean;
};

export type PostDoc = {
  type: string;
  content?: unknown[];
};

export type PostEntry = {
  slug: string;
  meta: PostMeta;
  doc: PostDoc;
  encrypted?: EncryptedPayload;
};

const privateMode = import.meta.env.PUBLIC_PRIVATE_MODE === 'true';

const postModules = import.meta.glob('../content/posts/*.json', { eager: true });
const encryptedModules = import.meta.glob('../content/encrypted/*.json', {
  eager: true,
});

function renderMath(html: string) {
  let output = html;
  output = output.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    return katex.renderToString(expr.trim(), {
      displayMode: true,
      throwOnError: false,
    });
  });
  output = output.replace(/\$([^$\n]+)\$/g, (_, expr) => {
    return katex.renderToString(expr.trim(), {
      displayMode: false,
      throwOnError: false,
    });
  });
  return output;
}

export function loadPosts(): PostEntry[] {
  const entries: PostEntry[] = [];

  Object.entries(postModules).forEach(([path, mod]) => {
    const data = (mod as { default: PostEntry }).default;
    const slug = path.split('/').pop()?.replace('.json', '') ?? data.slug;
    const encrypted = (
      encryptedModules[`../content/encrypted/${slug}.json`] as {
        default?: EncryptedPayload;
      }
    )?.default;
    entries.push({
      ...data,
      slug,
      encrypted,
    });
  });

  return entries
    .filter((post) => !post.meta.draft)
    .sort(
      (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
    );
}

export function renderPostHtml(post: PostEntry): string {
  if (privateMode) {
    return '';
  }
  const rawHtml = renderTiptapToHtml(post.doc);
  const withMath = renderMath(rawHtml);
  return DOMPurify.sanitize(withMath);
}

/**
 * 상세 페이지용 렌더링.
 * 정제된 HTML에 코드 하이라이팅·헤딩 앵커·표 래퍼를 입히고 목차를 함께 반환한다.
 */
export async function renderPost(
  post: PostEntry,
): Promise<{ html: string; toc: TocEntry[] }> {
  const sanitized = renderPostHtml(post);
  if (!sanitized) return { html: '', toc: [] };
  return enhanceHtml(sanitized);
}

/* ------------------------------------------------------------------
   본문 텍스트 파생 정보
   ------------------------------------------------------------------ */

type TiptapNode = {
  type?: string;
  text?: string;
  content?: TiptapNode[];
};

/** Tiptap 문서에서 순수 텍스트만 추출 (검색 색인 / 읽기 시간 / 요약용) */
export function docToText(doc: unknown): string {
  const parts: string[] = [];

  const walk = (node: TiptapNode | undefined) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.text === 'string') parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };

  walk(doc as TiptapNode);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function postText(post: PostEntry): string {
  // 비공개 모드에서는 본문이 암호화되므로 텍스트를 노출하지 않는다.
  return privateMode ? '' : docToText(post.doc);
}

export function postReadingTime(post: PostEntry): number {
  return readingTime(postText(post));
}

export function postSummary(post: PostEntry, length = 140): string {
  if (post.meta.summary) return post.meta.summary;
  const text = postText(post);
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

/* ------------------------------------------------------------------
   목록 / 탐색 헬퍼
   ------------------------------------------------------------------ */

export type TagCount = { tag: string; count: number };

export function getAllTags(posts = loadPosts()): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.meta.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko'));
}

export function getPostsByTag(tag: string, posts = loadPosts()): PostEntry[] {
  return posts.filter((post) =>
    (post.meta.tags ?? []).some(
      (candidate) => candidate.toLowerCase() === tag.toLowerCase(),
    ),
  );
}

export function getFeaturedPost(posts = loadPosts()): PostEntry | undefined {
  return posts.find((post) => post.meta.featured) ?? posts[0];
}

/** 목록은 최신순이므로 배열상 앞쪽이 더 최신 글이다. */
export function getAdjacentPosts(
  slug: string,
  posts = loadPosts(),
): { newer?: PostEntry; older?: PostEntry } {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return {
    newer: posts[index - 1],
    older: posts[index + 1],
  };
}

/** 태그 자카드 유사도로 관련 글을 고른다. 부족하면 최신 글로 채운다. */
export function getRelatedPosts(
  slug: string,
  limit = 3,
  posts = loadPosts(),
): PostEntry[] {
  const current = posts.find((post) => post.slug === slug);
  if (!current) return [];

  const currentTags = new Set(
    (current.meta.tags ?? []).map((tag) => tag.toLowerCase()),
  );

  const scored = posts
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const tags = (post.meta.tags ?? []).map((tag) => tag.toLowerCase());
      const shared = tags.filter((tag) => currentTags.has(tag)).length;
      const union = new Set([...currentTags, ...tags]).size || 1;
      return { post, score: shared / union };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.meta.date).getTime() -
          new Date(a.post.meta.date).getTime(),
    );

  return scored.slice(0, limit).map((entry) => entry.post);
}

export function groupPostsByYear(
  posts = loadPosts(),
): Array<{ year: number; posts: PostEntry[] }> {
  const groups = new Map<number, PostEntry[]>();
  for (const post of posts) {
    const year = new Date(post.meta.date).getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups.entries()]
    .map(([year, items]) => ({ year, posts: items }))
    .sort((a, b) => b.year - a.year);
}

/* ------------------------------------------------------------------
   검색 색인
   ------------------------------------------------------------------ */

export type SearchDoc = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  minutes: number;
  /** 본문 전문 검색용 발췌 (비공개 모드에서는 비어 있음) */
  body: string;
};

export function buildSearchIndex(posts = loadPosts()): SearchDoc[] {
  return posts.map((post) => ({
    slug: post.slug,
    title: post.meta.title,
    summary: postSummary(post),
    tags: post.meta.tags ?? [],
    date: post.meta.date,
    minutes: postReadingTime(post),
    body: postText(post).slice(0, 2000),
  }));
}

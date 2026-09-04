import type { APIContext } from 'astro';
import { getAllTags, loadPosts } from '../utils/posts';
import { absoluteUrl } from '../utils/url';

/** 정적 경로 + 글/태그 상세를 모두 담은 사이트맵. */
export async function GET(context: APIContext) {
  const posts = loadPosts();
  const tags = getAllTags(posts);

  const url = (path: string) => absoluteUrl(path, context.site);

  const entries: Array<{ loc: string; lastmod?: string; priority: string }> = [
    { loc: url(''), priority: '1.0' },
    { loc: url('posts'), priority: '0.9' },
    { loc: url('tags'), priority: '0.6' },
    { loc: url('archive'), priority: '0.6' },
    { loc: url('about'), priority: '0.5' },
    ...posts.map((post) => ({
      loc: url(`posts/${post.slug}`),
      lastmod: new Date(post.meta.updated ?? post.meta.date)
        .toISOString()
        .slice(0, 10),
      priority: '0.8',
    })),
    ...tags.map(({ tag }) => ({
      loc: url(`tags/${encodeURIComponent(tag)}`),
      priority: '0.4',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>\n${
        entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : ''
      }    <priority>${entry.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

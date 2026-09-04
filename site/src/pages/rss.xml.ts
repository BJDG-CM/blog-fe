import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config';
import { loadPosts, postSummary } from '../utils/posts';
import { absoluteUrl } from '../utils/url';

export async function GET(context: APIContext) {
  const posts = loadPosts();

  return rss({
    title: site.name,
    description: site.description,
    site: absoluteUrl('', context.site),
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.meta.title,
      description: postSummary(post, 220),
      pubDate: new Date(post.meta.date),
      // base 경로가 포함된 절대 URL을 직접 넘긴다.
      link: absoluteUrl(`posts/${post.slug}`, context.site),
      categories: post.meta.tags ?? [],
    })),
    customData: `<language>ko-kr</language>`,
  });
}

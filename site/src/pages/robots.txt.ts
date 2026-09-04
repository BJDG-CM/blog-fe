import type { APIContext } from 'astro';
import { absoluteUrl } from '../utils/url';

export async function GET(context: APIContext) {
  const body = [
    'User-agent: *',
    'Allow: /',
    // 관리 화면과 편집 API는 색인 대상이 아니다.
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${absoluteUrl('sitemap.xml', context.site)}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

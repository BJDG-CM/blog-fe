import { createHighlighter, type Highlighter } from 'shiki';
import { slugify } from './slugify';

/**
 * 렌더된 본문 HTML을 사이트 UI에 맞게 후처리한다.
 * - 코드 블록: shiki 듀얼 테마 하이라이팅 + 복사 버튼이 붙는 래퍼
 * - 헤딩: 고유 id 부여 + 앵커 링크 (목차와 슬러그를 공유)
 * - 표: 가로 스크롤 래퍼
 * - 이미지: lazy loading
 *
 * 입력은 이미 DOMPurify로 정제된 HTML이라고 가정한다.
 */

export type TocEntry = {
  depth: number;
  text: string;
  slug: string;
};

const SHIKI_LANGS = [
  'astro',
  'bash',
  'c',
  'cpp',
  'css',
  'diff',
  'go',
  'graphql',
  'html',
  'java',
  'javascript',
  'json',
  'jsx',
  'kotlin',
  'markdown',
  'php',
  'python',
  'ruby',
  'rust',
  'scss',
  'shell',
  'sql',
  'swift',
  'toml',
  'tsx',
  'typescript',
  'xml',
  'yaml',
];

const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  golang: 'go',
  'c++': 'cpp',
  plaintext: 'text',
  txt: 'text',
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: SHIKI_LANGS,
    });
  }
  return highlighterPromise;
}

function decodeEntities(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** `<h1~h3>` 에 id/앵커를 부여하고 목차 항목을 함께 반환한다. */
function applyHeadings(html: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const used = new Set<string>();

  const out = html.replace(
    /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (_match, level: string, attrs: string, inner: string) => {
      const depth = Number(level);
      const text = decodeEntities(inner.replace(/<[^>]+>/g, '')).trim();
      if (!text) return _match;

      let slug = slugify(text);
      let candidate = slug;
      let counter = 2;
      while (used.has(candidate)) {
        candidate = `${slug}-${counter}`;
        counter += 1;
      }
      slug = candidate;
      used.add(slug);

      toc.push({ depth, text, slug });

      const anchor = `<a class="anchor" href="#${slug}" aria-label="${escapeHtml(
        text,
      )} 섹션 링크">#</a>`;
      return `<h${level} id="${slug}"${attrs}>${anchor}${inner}</h${level}>`;
    },
  );

  return { html: out, toc };
}

function wrapTables(html: string): string {
  return html.replace(
    /<table(?![^>]*data-wrapped)([\s\S]*?)<\/table>/g,
    (match) => `<div class="table-wrapper">${match}</div>`,
  );
}

function enhanceImages(html: string): string {
  return html.replace(/<img\b([^>]*?)\/?>/g, (match, attrs: string) => {
    if (/loading=/.test(attrs)) return match;
    return `<img${attrs} loading="lazy" decoding="async" />`;
  });
}

async function highlightCodeBlocks(html: string): Promise<string> {
  const pattern = /<pre[^>]*>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/g;
  const matches = [...html.matchAll(pattern)];
  if (matches.length === 0) return html;

  const highlighter = await getHighlighter();
  const loaded = new Set(highlighter.getLoadedLanguages());

  const replacements = matches.map((match) => {
    const attrs = match[1] ?? '';
    const rawCode = decodeEntities(match[2] ?? '').replace(/\n$/, '');

    const langMatch = /(?:class|data-language)="[^"]*?language-([\w+#-]+)/.exec(
      attrs,
    );
    const requested = (langMatch?.[1] ?? 'text').toLowerCase();
    const resolved = LANG_ALIASES[requested] ?? requested;
    const lang = loaded.has(resolved) ? resolved : 'text';

    const pre = highlighter.codeToHtml(rawCode, {
      lang,
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    });

    const label = lang === 'text' ? 'code' : lang;
    const block = [
      '<div class="code-block" data-code-block>',
      '<div class="code-head">',
      `<span class="lang">${escapeHtml(label)}</span>`,
      '<button type="button" class="copy-btn" data-copy aria-label="코드 복사">',
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
      '<span data-copy-label>복사</span>',
      '</button>',
      '</div>',
      pre,
      '</div>',
    ].join('');

    return { from: match[0], to: block };
  });

  let output = html;
  for (const { from, to } of replacements) {
    output = output.replace(from, () => to);
  }
  return output;
}

export async function enhanceHtml(
  html: string,
): Promise<{ html: string; toc: TocEntry[] }> {
  const withHeadings = applyHeadings(html);
  let output = wrapTables(withHeadings.html);
  output = enhanceImages(output);
  output = await highlightCodeBlocks(output);
  return { html: output, toc: withHeadings.toc };
}

import DOMPurify from 'dompurify';
import katex from 'katex';
import { renderTiptapToHtml } from './tiptap';
import type { EncryptedPayload } from './crypto';

export type PostMeta = {
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  draft?: boolean;
  summary?: string;
  cover?: string;
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
const encryptedModules = import.meta.glob('../content/encrypted/*.json', { eager: true });

function renderMath(html: string) {
  let output = html;
  output = output.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
  });
  output = output.replace(/\$([^$\n]+)\$/g, (_, expr) => {
    return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
  });
  return output;
}

export function loadPosts(): PostEntry[] {
  const entries: PostEntry[] = [];

  Object.entries(postModules).forEach(([path, mod]) => {
    const data = (mod as { default: PostEntry }).default;
    const slug = path.split('/').pop()?.replace('.json', '') ?? data.slug;
    const encrypted = (encryptedModules[`../content/encrypted/${slug}.json`] as { default?: EncryptedPayload })?.default;
    entries.push({
      ...data,
      slug,
      encrypted
    });
  });

  return entries
    .filter((post) => !post.meta.draft)
    .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());
}

export function renderPostHtml(post: PostEntry): string {
  if (privateMode) {
    return '';
  }
  const rawHtml = renderTiptapToHtml(post.doc);
  const withMath = renderMath(rawHtml);
  return DOMPurify.sanitize(withMath);
}

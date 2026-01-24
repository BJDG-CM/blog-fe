import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  if (typeof DOMPurify?.sanitize !== 'function') {
    return html;
  }
  return DOMPurify.sanitize(html);
}

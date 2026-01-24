import { describe, expect, it } from 'vitest';
import { ensureUniqueSlug, slugify } from '../slugify';

describe('slugify', () => {
  it('creates stable slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('한글 제목')).toContain('한글');
  });

  it('ensures unique slugs', () => {
    const set = new Set(['post', 'post-2']);
    expect(ensureUniqueSlug('post', set)).toBe('post-3');
  });
});

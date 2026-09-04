import { describe, expect, it } from 'vitest';
import {
  ValidationError,
  assertFileName,
  assertSlug,
  normalizePost,
  postPath,
  serializePost,
  uploadPath,
} from '../post-payload';

const validDoc = { type: 'doc', content: [] };

describe('assertSlug', () => {
  it('한글·영문·숫자와 -, _ 를 허용한다', () => {
    expect(assertSlug('hello-world')).toBe('hello-world');
    expect(assertSlug('첫_번째-글2')).toBe('첫_번째-글2');
  });

  it('경로를 벗어나는 입력을 막는다', () => {
    for (const bad of [
      '../../etc/passwd',
      'a/b',
      '.hidden',
      'post.json',
      'a\\b',
      '',
      '   ',
    ]) {
      expect(() => assertSlug(bad)).toThrow(ValidationError);
    }
  });

  it('문자열이 아니거나 너무 길면 거부한다', () => {
    expect(() => assertSlug(undefined)).toThrow(ValidationError);
    expect(() => assertSlug(42)).toThrow(ValidationError);
    expect(() => assertSlug('a'.repeat(121))).toThrow(ValidationError);
  });
});

describe('assertFileName', () => {
  it('확장자가 있는 단순 파일명만 통과시킨다', () => {
    expect(assertFileName('1717000000000.png')).toBe('1717000000000.png');
  });

  it('경로 조작을 막는다', () => {
    for (const bad of ['../a.png', 'a/b.png', '.env', 'noext', 'a..png']) {
      expect(() => assertFileName(bad)).toThrow(ValidationError);
    }
  });
});

describe('normalizePost', () => {
  const base = {
    slug: 'sample',
    meta: { title: '제목', date: '2026-09-04', tags: ['a', 'b'] },
    doc: validDoc,
  };

  it('올바른 입력을 정규화한다', () => {
    const result = normalizePost(base);
    expect(result.slug).toBe('sample');
    expect(result.meta.title).toBe('제목');
    expect(result.meta.tags).toEqual(['a', 'b']);
  });

  it('제목 앞뒤 공백을 정리하고 빈 제목은 거부한다', () => {
    expect(normalizePost({ ...base, meta: { ...base.meta, title: '  x  ' } }).meta.title).toBe('x');
    expect(() =>
      normalizePost({ ...base, meta: { ...base.meta, title: '   ' } }),
    ).toThrow(ValidationError);
  });

  it('날짜 형식을 강제한다', () => {
    for (const bad of ['2026/09/04', '20260904', '2026-13-45', '']) {
      expect(() =>
        normalizePost({ ...base, meta: { ...base.meta, date: bad } }),
      ).toThrow(ValidationError);
    }
  });

  it('태그를 정리하고 중복을 제거한다', () => {
    const result = normalizePost({
      ...base,
      meta: { ...base.meta, tags: [' a ', 'a', '', 'b', 42] },
    });
    expect(result.meta.tags).toEqual(['a', 'b']);
  });

  it('doc 이 없거나 형식이 다르면 거부한다', () => {
    expect(() => normalizePost({ ...base, doc: null })).toThrow(ValidationError);
    expect(() => normalizePost({ ...base, doc: { type: 'paragraph' } })).toThrow(
      ValidationError,
    );
  });

  it('선택 필드는 값이 있을 때만 남긴다', () => {
    const bare = normalizePost(base);
    expect(bare.meta).not.toHaveProperty('summary');
    expect(bare.meta).not.toHaveProperty('draft');

    const full = normalizePost({
      ...base,
      meta: {
        ...base.meta,
        summary: ' 요약 ',
        draft: true,
        featured: true,
        updated: '2026-09-05',
      },
    });
    expect(full.meta.summary).toBe('요약');
    expect(full.meta.draft).toBe(true);
    expect(full.meta.featured).toBe(true);
    expect(full.meta.updated).toBe('2026-09-05');
  });

  it('알 수 없는 meta 필드는 버린다', () => {
    const result = normalizePost({
      ...base,
      meta: { ...base.meta, evil: 'x' },
    });
    expect(result.meta).not.toHaveProperty('evil');
  });
});

describe('경로 조합', () => {
  it('글과 업로드 경로를 만든다', () => {
    expect(postPath('sample')).toBe('site/src/content/posts/sample.json');
    expect(uploadPath('sample', 'a.png')).toBe(
      'site/public/uploads/sample/a.png',
    );
  });

  it('작성도구가 만든 파일과 같은 모양으로 직렬화한다', () => {
    const text = serializePost(normalizePost({
      slug: 'sample',
      meta: { title: 'T', date: '2026-09-04', tags: [] },
      doc: validDoc,
    }));
    expect(text.endsWith('\n')).toBe(true);
    expect(JSON.parse(text).slug).toBe('sample');
  });
});

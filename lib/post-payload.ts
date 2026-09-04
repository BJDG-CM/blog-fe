/**
 * 편집 API 로 들어온 값을 저장소에 쓰기 전에 검증한다.
 *
 * 슬러그가 그대로 파일 경로가 되므로, 경로를 벗어나는 입력을 여기서 막는다.
 */

export class ValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** 파일명으로 안전한 슬러그만 통과시킨다. */
export function assertSlug(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ValidationError('슬러그가 필요합니다.');
  }
  if (value.length > 120) {
    throw new ValidationError('슬러그가 너무 깁니다.');
  }
  // 경로 구분자, 상위 디렉터리, 숨김 파일, 확장자 조작을 모두 차단
  if (!/^[a-z0-9가-힣][a-z0-9가-힣_-]*$/i.test(value)) {
    throw new ValidationError(
      '슬러그는 한글·영문·숫자와 -, _ 만 쓸 수 있습니다.',
    );
  }
  return value;
}

/** 업로드 파일명도 같은 기준으로 제한한다. */
export function assertFileName(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ValidationError('파일 이름이 필요합니다.');
  }
  if (value.length > 120) {
    throw new ValidationError('파일 이름이 너무 깁니다.');
  }
  if (!/^[a-z0-9][a-z0-9._-]*\.[a-z0-9]{1,8}$/i.test(value)) {
    throw new ValidationError('허용되지 않는 파일 이름입니다.');
  }
  if (value.includes('..')) {
    throw new ValidationError('허용되지 않는 파일 이름입니다.');
  }
  return value;
}

export type PostMeta = {
  title: string;
  date: string;
  tags: string[];
  summary?: string;
  updated?: string;
  cover?: string;
  draft?: boolean;
  featured?: boolean;
};

export type PostPayload = {
  slug: string;
  meta: PostMeta;
  doc: Record<string, unknown>;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 저장 요청 본문을 검증해 파일에 쓸 형태로 정규화한다. */
export function normalizePost(input: unknown): PostPayload {
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError('본문이 비어 있습니다.');
  }

  const body = input as Record<string, unknown>;
  const slug = assertSlug(body.slug);

  if (typeof body.meta !== 'object' || body.meta === null) {
    throw new ValidationError('meta 가 필요합니다.');
  }
  const meta = body.meta as Record<string, unknown>;

  const title = typeof meta.title === 'string' ? meta.title.trim() : '';
  if (!title) throw new ValidationError('제목이 필요합니다.');
  if (title.length > 200) throw new ValidationError('제목이 너무 깁니다.');

  const date = typeof meta.date === 'string' ? meta.date.slice(0, 10) : '';
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
    throw new ValidationError('날짜는 YYYY-MM-DD 형식이어야 합니다.');
  }

  const tags = Array.isArray(meta.tags)
    ? [
        ...new Set(
          meta.tags
            .filter((tag): tag is string => typeof tag === 'string')
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 20),
        ),
      ]
    : [];

  if (typeof body.doc !== 'object' || body.doc === null) {
    throw new ValidationError('본문 문서가 필요합니다.');
  }
  const doc = body.doc as Record<string, unknown>;
  if (doc.type !== 'doc') {
    throw new ValidationError('본문 문서 형식이 올바르지 않습니다.');
  }

  const normalized: PostMeta = { title, date, tags };

  if (typeof meta.summary === 'string' && meta.summary.trim()) {
    normalized.summary = meta.summary.trim().slice(0, 400);
  }
  if (typeof meta.updated === 'string' && DATE_PATTERN.test(meta.updated)) {
    normalized.updated = meta.updated;
  }
  if (typeof meta.cover === 'string' && meta.cover.trim()) {
    normalized.cover = meta.cover.trim();
  }
  if (meta.draft === true) normalized.draft = true;
  if (meta.featured === true) normalized.featured = true;

  return { slug, meta: normalized, doc };
}

export function postPath(slug: string) {
  return `site/src/content/posts/${slug}.json`;
}

export function uploadPath(slug: string, fileName: string) {
  return `site/public/uploads/${slug}/${fileName}`;
}

export function serializePost(post: PostPayload) {
  return `${JSON.stringify(post, null, 2)}\n`;
}

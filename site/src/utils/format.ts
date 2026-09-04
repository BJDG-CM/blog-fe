const LOCALE = 'ko-KR';

export function formatDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return String(input);
  return new Intl.DateTimeFormat(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDateShort(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return String(input);
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** `<time datetime>` 용 ISO 날짜 (YYYY-MM-DD) */
export function isoDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * 한국어/영문 혼용 본문의 대략적인 읽기 시간(분).
 * 한국어 500자/분, 영문 220단어/분 기준.
 */
export function readingTime(text: string): number {
  const korean = (text.match(/[가-힣]/g) ?? []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(korean / 500 + words / 220));
}

/**
 * 슬러그 문자열로부터 결정적인 색상 각도를 만든다.
 * 커버 이미지가 없는 글에도 일관된 고유 그라디언트를 부여하기 위한 용도.
 */
export function hueFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export function gradientFor(input: string): string {
  const hue = hueFromString(input);
  return `linear-gradient(140deg, oklch(62% 0.17 ${hue}), oklch(58% 0.19 ${
    (hue + 55) % 360
  }))`;
}

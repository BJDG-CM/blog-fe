import { describe, expect, it } from 'vitest';
import {
  formatDate,
  gradientFor,
  hueFromString,
  isoDate,
  readingTime,
} from '../format';

describe('formatDate', () => {
  it('한국어 날짜로 표시한다', () => {
    expect(formatDate('2026-09-04')).toBe('2026년 9월 4일');
  });

  it('잘못된 날짜는 입력값을 그대로 돌려준다', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('isoDate', () => {
  it('YYYY-MM-DD 형태를 만든다', () => {
    expect(isoDate('2026-09-04T10:00:00Z')).toBe('2026-09-04');
  });
});

describe('readingTime', () => {
  it('짧은 글도 최소 1분으로 계산한다', () => {
    expect(readingTime('짧다')).toBe(1);
  });

  it('한국어 500자당 약 1분으로 늘어난다', () => {
    expect(readingTime('가'.repeat(1500))).toBe(3);
  });

  it('영문 단어 수도 함께 반영한다', () => {
    expect(readingTime('word '.repeat(440))).toBe(2);
  });
});

describe('gradientFor', () => {
  it('같은 슬러그면 항상 같은 그라디언트를 만든다', () => {
    expect(gradientFor('hello')).toBe(gradientFor('hello'));
  });

  it('다른 슬러그면 다른 색상 각도를 쓴다', () => {
    expect(hueFromString('hello')).not.toBe(hueFromString('world'));
  });

  it('색상 각도는 0~359 범위 안에 있다', () => {
    for (const slug of ['a', 'post-1', '한글-슬러그', 'zzz']) {
      const hue = hueFromString(slug);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
});

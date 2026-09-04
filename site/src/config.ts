/**
 * 사이트 전역 설정.
 * 값만 바꾸면 헤더/푸터/메타태그/RSS 전반에 반영됩니다.
 */
export const site = {
  name: '이예준의 기록',
  shortName: 'Yejun',
  description:
    '개발하며 배운 것, 만든 것, 생각한 것을 남깁니다. 프론트엔드와 프로덕트에 관한 글.',
  author: {
    name: '이예준',
    bio: '제품을 만드는 개발자입니다. 웹과 그 언저리에서 일합니다.',
    email: 'yejuneric@gmail.com',
  },
  locale: 'ko-KR',
  /** 헤더/모바일 탭에 노출되는 메뉴 */
  nav: [
    { href: '', label: '홈', icon: 'home' },
    { href: 'posts', label: '글', icon: 'posts' },
    { href: 'tags', label: '태그', icon: 'tags' },
    { href: 'archive', label: '아카이브', icon: 'archive' },
    { href: 'about', label: '소개', icon: 'about' },
  ],
  social: [
    { label: 'GitHub', href: 'https://github.com/BJDG-CM' },
    { label: 'Email', href: 'mailto:yejuneric@gmail.com' },
  ],
  /** 홈에 노출할 최근 글 수 */
  recentCount: 6,
} as const;

export type SiteConfig = typeof site;

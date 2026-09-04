/**
 * GitHub Pages 하위 경로 배포(`/repo-name/`)를 고려한 링크 헬퍼.
 * `import.meta.env.BASE_URL` 은 항상 `/` 로 끝난다고 보장되지 않으므로 직접 정규화한다.
 */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

/**
 * 절대 URL을 만든다.
 *
 * 배포 워크플로우는 `PUBLIC_SITE_URL` 에 base 경로까지 포함해 넘기고
 * (`https://example.com/blog-fe/`), `withBase()` 도 base 를 붙이기 때문에
 * 단순 문자열 결합을 하면 base 가 두 번 붙는다. 항상 origin 만 취해서 조합한다.
 */
export function absoluteUrl(path: string, site: URL | string | undefined) {
  const withBasePath = withBase(path);
  if (!site) return withBasePath;
  try {
    return new URL(withBasePath, new URL(site.toString()).origin).toString();
  } catch {
    return withBasePath;
  }
}

/** 현재 경로가 주어진 메뉴 항목에 해당하는지 (헤더 활성 표시용) */
export function isActivePath(currentPath: string, navHref: string): boolean {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  const current = currentPath.replace(/\/+$/, '') || '/';
  const home = normalizedBase.replace(/\/+$/, '') || '/';

  if (navHref === '') return current === home;

  const target = `${home === '/' ? '' : home}/${navHref}`;
  return current === target || current.startsWith(`${target}/`);
}

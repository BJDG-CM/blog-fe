/**
 * GitHub Contents API 로 저장소에 파일을 읽고 쓰는 얇은 래퍼.
 *
 * 사이트는 정적 빌드이므로 편집 결과는 저장소에 커밋되고, 그 푸시가
 * 재빌드를 트리거한다. 즉 저장소가 곧 데이터베이스다.
 */

export type GitHubEnv = {
  /** contents:read/write 권한의 fine-grained 토큰 */
  GITHUB_TOKEN?: string;
  /** owner/repo 형식 */
  GITHUB_REPO?: string;
  /** 커밋 대상 브랜치 (기본 master) */
  GITHUB_BRANCH?: string;
  /** 커밋 작성자 표시용 */
  GIT_AUTHOR_NAME?: string;
  GIT_AUTHOR_EMAIL?: string;
};

export class GitHubError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

export type RepoConfig = {
  token: string;
  repo: string;
  branch: string;
  authorName: string;
  authorEmail: string;
};

export function readRepoConfig(env: GitHubEnv): RepoConfig {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    throw new GitHubError(
      'GITHUB_TOKEN 과 GITHUB_REPO 환경 변수가 필요합니다.',
      500,
    );
  }
  return {
    token: env.GITHUB_TOKEN,
    repo: env.GITHUB_REPO,
    branch: env.GITHUB_BRANCH || 'master',
    authorName: env.GIT_AUTHOR_NAME || 'blog editor',
    authorEmail: env.GIT_AUTHOR_EMAIL || 'noreply@users.noreply.github.com',
  };
}

const API = 'https://api.github.com';

function headers(config: RepoConfig) {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'blog-admin',
  };
}

/** Uint8Array → base64 (Workers 환경에는 Buffer 가 없다) */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function textToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

export function base64ToText(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

type ContentEntry = {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir' | string;
  content?: string;
};

async function call(
  config: RepoConfig,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${API}/repos/${config.repo}${path}`, {
    ...init,
    headers: { ...headers(config), ...(init.headers ?? {}) },
  });
  return response;
}

/** 디렉터리 목록. 없으면 빈 배열. */
export async function listDirectory(
  config: RepoConfig,
  path: string,
): Promise<ContentEntry[]> {
  const response = await call(
    config,
    `/contents/${encodeURI(path)}?ref=${encodeURIComponent(config.branch)}`,
  );

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new GitHubError(`목록을 불러오지 못했습니다 (${response.status})`);
  }

  const body = (await response.json()) as ContentEntry[] | ContentEntry;
  return Array.isArray(body) ? body : [body];
}

/** 파일 하나를 읽는다. 없으면 null. */
export async function readFile(
  config: RepoConfig,
  path: string,
): Promise<{ text: string; sha: string } | null> {
  const response = await call(
    config,
    `/contents/${encodeURI(path)}?ref=${encodeURIComponent(config.branch)}`,
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new GitHubError(`파일을 읽지 못했습니다 (${response.status})`);
  }

  const body = (await response.json()) as ContentEntry;
  if (body.type !== 'file' || body.content === undefined) return null;
  return { text: base64ToText(body.content), sha: body.sha };
}

/**
 * 파일을 만들거나 덮어쓴다.
 * `expectedSha` 를 주면 그 시점 이후 다른 곳에서 바뀐 경우 409 로 막는다.
 */
export async function writeFile(
  config: RepoConfig,
  options: {
    path: string;
    contentBase64: string;
    message: string;
    expectedSha?: string | null;
  },
): Promise<{ commit: string; sha: string }> {
  const existing = await readFileSha(config, options.path);

  if (
    options.expectedSha !== undefined &&
    options.expectedSha !== null &&
    existing &&
    existing !== options.expectedSha
  ) {
    throw new GitHubError(
      '다른 곳에서 먼저 저장되었습니다. 새로고침 후 다시 시도해 주세요.',
      409,
    );
  }

  const response = await call(config, `/contents/${encodeURI(options.path)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: options.message,
      content: options.contentBase64,
      branch: config.branch,
      sha: existing ?? undefined,
      committer: { name: config.authorName, email: config.authorEmail },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new GitHubError(
      `저장하지 못했습니다 (${response.status}) ${detail.slice(0, 200)}`,
      response.status === 409 ? 409 : 502,
    );
  }

  const body = (await response.json()) as {
    commit?: { sha?: string };
    content?: { sha?: string };
  };
  return { commit: body.commit?.sha ?? '', sha: body.content?.sha ?? '' };
}

async function readFileSha(
  config: RepoConfig,
  path: string,
): Promise<string | null> {
  const response = await call(
    config,
    `/contents/${encodeURI(path)}?ref=${encodeURIComponent(config.branch)}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new GitHubError(`파일 정보를 읽지 못했습니다 (${response.status})`);
  }
  const body = (await response.json()) as ContentEntry;
  return body.sha ?? null;
}

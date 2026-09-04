/**
 * Cloudflare Access 토큰 검증.
 *
 * Access 는 정책을 통과한 요청에만 `Cf-Access-Jwt-Assertion` 헤더를 붙여
 * 오리진으로 보낸다. 엣지에서 이미 걸러지지만, 함수 자체도 토큰을 확인해
 * 정책이 잘못 설정되거나 우회되는 경우에 쓰기 API가 열리지 않게 한다.
 */

export type AccessEnv = {
  /** 예: my-team.cloudflareaccess.com */
  CF_ACCESS_TEAM_DOMAIN?: string;
  /** Access 애플리케이션의 Application Audience (AUD) 태그 */
  CF_ACCESS_AUD?: string;
};

export type AccessIdentity = {
  email: string;
  subject: string;
};

type Jwk = JsonWebKey & { kid: string };

const JWKS_TTL_MS = 60 * 60 * 1000;

let jwksCache: { url: string; keys: Jwk[]; fetchedAt: number } | null = null;

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeSegment<T>(segment: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as T;
}

async function loadKeys(teamDomain: string): Promise<Jwk[]> {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;

  if (jwksCache && jwksCache.url === url) {
    if (Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Access 인증서를 가져오지 못했습니다 (${response.status})`);
  }

  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  jwksCache = { url, keys, fetchedAt: Date.now() };
  return keys;
}

/** 테스트에서 캐시를 비우기 위한 훅 */
export function resetAccessKeyCache() {
  jwksCache = null;
}

export class AccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'AccessError';
    this.status = status;
  }
}

/**
 * 요청에 담긴 Access 토큰을 검증하고 로그인한 사용자를 돌려준다.
 * 검증에 실패하면 AccessError 를 던진다.
 */
export async function verifyAccessToken(
  request: Request,
  env: AccessEnv,
): Promise<AccessIdentity> {
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;
  const audience = env.CF_ACCESS_AUD;

  if (!teamDomain || !audience) {
    // 설정이 빠진 상태로 쓰기 API가 열리는 것이 가장 위험하므로 잠근다.
    throw new AccessError(
      'Access 설정(CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD)이 없습니다.',
      500,
    );
  }

  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ??
    readCookie(request.headers.get('Cookie'), 'CF_Authorization');

  if (!token) throw new AccessError('로그인이 필요합니다.', 401);

  const parts = token.split('.');
  if (parts.length !== 3) throw new AccessError('토큰 형식이 올바르지 않습니다.');

  const header = decodeSegment<{ kid?: string; alg?: string }>(parts[0]);
  if (header.alg !== 'RS256') throw new AccessError('지원하지 않는 서명 방식입니다.');
  if (!header.kid) throw new AccessError('토큰에 키 식별자가 없습니다.');

  const keys = await loadKeys(teamDomain);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new AccessError('토큰 서명 키를 찾을 수 없습니다.');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(parts[2]),
    signed,
  );
  if (!valid) throw new AccessError('토큰 서명이 유효하지 않습니다.');

  const payload = decodeSegment<{
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iss?: string;
    email?: string;
    sub?: string;
  }>(parts[1]);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp !== undefined && payload.exp < now) {
    throw new AccessError('로그인이 만료되었습니다.', 401);
  }
  if (payload.nbf !== undefined && payload.nbf > now + 60) {
    throw new AccessError('토큰이 아직 유효하지 않습니다.');
  }

  const audiences = Array.isArray(payload.aud)
    ? payload.aud
    : payload.aud
      ? [payload.aud]
      : [];
  if (!audiences.includes(audience)) {
    throw new AccessError('다른 애플리케이션의 토큰입니다.');
  }

  if (payload.iss !== `https://${teamDomain}`) {
    throw new AccessError('발급자가 일치하지 않습니다.');
  }

  return { email: payload.email ?? '', subject: payload.sub ?? '' };
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

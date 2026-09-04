import type { AccessIdentity } from '../../lib/access';

/**
 * GET /api/me — 현재 로그인한 사용자.
 *
 * 미들웨어를 통과했다는 것 자체가 인증되었다는 뜻이므로,
 * 관리 화면은 이 응답으로 로그인 여부를 확인한다.
 */
export const onRequestGet: PagesFunction = async (context) => {
  const identity = (context.data as { identity?: AccessIdentity } | undefined)
    ?.identity;

  return Response.json({
    email: identity?.email ?? '',
    subject: identity?.subject ?? '',
  });
};

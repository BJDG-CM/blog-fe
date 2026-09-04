import { AccessError, verifyAccessToken, type AccessEnv } from '../../lib/access';

/**
 * /api/* 전체를 Cloudflare Access 뒤에 둔다.
 *
 * Access 정책이 엣지에서 먼저 걸러주지만, 함수도 토큰을 직접 확인해
 * 정책이 빠졌을 때 쓰기 API가 공개되는 일이 없게 한다.
 */
export const onRequest: PagesFunction<AccessEnv> = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    const identity = await verifyAccessToken(context.request, context.env);
    context.data = { ...(context.data ?? {}), identity };
  } catch (error) {
    const status = error instanceof AccessError ? error.status : 403;
    const message =
      error instanceof Error ? error.message : '인증에 실패했습니다.';
    return Response.json({ error: message }, { status });
  }

  return context.next();
};

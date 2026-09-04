import {
  GitHubError,
  readFile,
  readRepoConfig,
  textToBase64,
  writeFile,
  type GitHubEnv,
} from '../../../lib/github';
import {
  ValidationError,
  assertSlug,
  postPath,
} from '../../../lib/post-payload';

type Env = GitHubEnv;

/** GET /api/posts/:slug — 편집할 글 원본 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const config = readRepoConfig(context.env);
    const slug = assertSlug(context.params.slug);

    const file = await readFile(config, postPath(slug));
    if (!file) {
      return Response.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
    }

    return Response.json({ ...JSON.parse(file.text), sha: file.sha });
  } catch (error) {
    return errorResponse(error);
  }
};

/**
 * DELETE /api/posts/:slug — 글 감추기.
 *
 * 파일을 지우는 대신 draft 로 돌린다. 실수로 지운 글을 되살리기 쉽고
 * 히스토리도 그대로 남는다.
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const config = readRepoConfig(context.env);
    const slug = assertSlug(context.params.slug);

    const file = await readFile(config, postPath(slug));
    if (!file) {
      return Response.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
    }

    const json = JSON.parse(file.text) as {
      meta?: Record<string, unknown>;
      [key: string]: unknown;
    };
    json.meta = { ...(json.meta ?? {}), draft: true };

    const result = await writeFile(config, {
      path: postPath(slug),
      contentBase64: textToBase64(`${JSON.stringify(json, null, 2)}\n`),
      message: `content: Unpublish post "${slug}"`,
      expectedSha: file.sha,
    });

    return Response.json({ ok: true, sha: result.sha, commit: result.commit });
  } catch (error) {
    return errorResponse(error);
  }
};

function errorResponse(error: unknown): Response {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof GitHubError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : '알 수 없는 오류';
  return Response.json({ error: message }, { status: 500 });
}

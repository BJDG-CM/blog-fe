import {
  GitHubError,
  listDirectory,
  readFile,
  readRepoConfig,
  textToBase64,
  writeFile,
  type GitHubEnv,
} from '../../lib/github';
import {
  ValidationError,
  normalizePost,
  postPath,
  serializePost,
} from '../../lib/post-payload';
import type { AccessIdentity } from '../../lib/access';

type Env = GitHubEnv;

/** GET /api/posts — 편집 가능한 글 목록 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const config = readRepoConfig(context.env);
    const entries = await listDirectory(config, 'site/src/content/posts');

    const posts = await Promise.all(
      entries
        .filter((entry) => entry.type === 'file' && entry.name.endsWith('.json'))
        .map(async (entry) => {
          const file = await readFile(config, entry.path);
          if (!file) return null;
          try {
            const json = JSON.parse(file.text) as {
              slug?: string;
              meta?: Record<string, unknown>;
            };
            return {
              slug: json.slug ?? entry.name.replace(/\.json$/, ''),
              meta: json.meta ?? {},
              sha: file.sha,
            };
          } catch {
            return null;
          }
        }),
    );

    return Response.json({
      posts: posts
        .filter((post): post is NonNullable<typeof post> => post !== null)
        .sort((a, b) =>
          String(b.meta.date ?? '').localeCompare(String(a.meta.date ?? '')),
        ),
    });
  } catch (error) {
    return errorResponse(error);
  }
};

/** POST /api/posts — 글 저장 (신규/수정 공통) */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const config = readRepoConfig(context.env);
    const body = (await context.request.json()) as Record<string, unknown>;

    const post = normalizePost(body);
    const expectedSha =
      typeof body.sha === 'string' && body.sha ? body.sha : null;

    const identity = (context.data as { identity?: AccessIdentity } | undefined)
      ?.identity;
    const who = identity?.email ? ` (${identity.email})` : '';

    const existing = await readFile(config, postPath(post.slug));
    const verb = existing ? 'Update' : 'Add';

    const result = await writeFile(config, {
      path: postPath(post.slug),
      contentBase64: textToBase64(serializePost(post)),
      message: `content: ${verb} post "${post.meta.title}"\n\nEdited from the site admin${who}.`,
      expectedSha,
    });

    return Response.json({
      ok: true,
      slug: post.slug,
      sha: result.sha,
      commit: result.commit,
    });
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

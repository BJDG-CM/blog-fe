import {
  GitHubError,
  bytesToBase64,
  readRepoConfig,
  writeFile,
  type GitHubEnv,
} from '../../../lib/github';
import {
  ValidationError,
  assertFileName,
  assertSlug,
  uploadPath,
} from '../../../lib/post-payload';

type Env = GitHubEnv;

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = new Map<string, string>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/svg+xml', 'svg'],
]);

/** POST /api/uploads/:slug — 본문에 넣을 이미지 업로드 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const config = readRepoConfig(context.env);
    const slug = assertSlug(context.params.slug);

    const form = await context.request.formData();
    const entry = form.get('file');

    // Workers 런타임에는 File 전역이 없을 수 있어 형태로 판별한다.
    const file = entry as {
      size?: number;
      type?: string;
      arrayBuffer?: () => Promise<ArrayBuffer>;
    } | null;

    if (!file || typeof file.arrayBuffer !== 'function') {
      throw new ValidationError('파일이 없습니다.');
    }
    if (typeof file.size !== 'number') {
      throw new ValidationError('파일이 올바르지 않습니다.');
    }
    if (file.size > MAX_BYTES) {
      throw new ValidationError('이미지는 5MB 이하만 올릴 수 있습니다.');
    }

    const extension = ALLOWED.get(file.type ?? '');
    if (!extension) {
      throw new ValidationError('PNG, JPEG, WebP, GIF, SVG 만 올릴 수 있습니다.');
    }

    // 원본 이름을 그대로 쓰지 않고 타임스탬프로 새로 만든다.
    const fileName = assertFileName(`${Date.now()}.${extension}`);
    const bytes = new Uint8Array(await file.arrayBuffer());

    const path = uploadPath(slug, fileName);
    await writeFile(config, {
      path,
      contentBase64: bytesToBase64(bytes),
      message: `content: Add image for "${slug}"`,
    });

    return Response.json({ ok: true, url: `/uploads/${slug}/${fileName}` });
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlock from '@tiptap/extension-code-block';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Strike from '@tiptap/extension-strike';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Text from '@tiptap/extension-text';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';

import { FontSize } from '../../utils/fontSize';
import { slugify } from '../../utils/slugify';
import Toolbar from './Toolbar';

type PostMeta = {
  title: string;
  date: string;
  tags: string[];
  summary?: string;
  updated?: string;
  draft?: boolean;
  featured?: boolean;
};

type PostSummary = { slug: string; meta: PostMeta; sha: string };

type LoadedPost = {
  slug: string;
  meta: PostMeta;
  doc: Record<string, unknown>;
  sha: string;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; text: string }
  | { kind: 'ok'; text: string }
  | { kind: 'error'; text: string };

const emptyDoc = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const today = () => new Date().toISOString().slice(0, 10);

const extensions = [
  Document,
  Paragraph,
  Text,
  Heading.configure({ levels: [1, 2, 3] }),
  Bold,
  Italic,
  Underline,
  Strike,
  TextStyle,
  FontSize,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  BulletList,
  OrderedList,
  ListItem,
  Blockquote,
  CodeBlock,
  HorizontalRule,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  Image,
  Link.configure({ openOnClick: false }),
  History,
];

export default function Editor() {
  const [email, setEmail] = useState<string | null>(null);
  const [authFailed, setAuthFailed] = useState(false);

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [current, setCurrent] = useState<LoadedPost | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [dirty, setDirty] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions,
    content: emptyDoc,
    onUpdate: () => setDirty(true),
    editorProps: {
      attributes: { class: 'prose admin-prose', spellcheck: 'false' },
    },
  });

  /* ---------------------------------------------------------------
     로딩
     --------------------------------------------------------------- */

  const loadList = useCallback(async () => {
    const response = await fetch('/api/posts');
    if (response.status === 401 || response.status === 403) {
      setAuthFailed(true);
      return;
    }
    const body = (await response.json()) as { posts?: PostSummary[] };
    setPosts(body.posts ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/me');
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setAuthFailed(true);
          return;
        }
        const body = (await response.json()) as { email?: string };
        if (!cancelled) setEmail(body.email ?? '');
        await loadList();
      } catch {
        if (!cancelled) setAuthFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadList]);

  // 저장하지 않은 변경이 있으면 이탈을 막는다.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const openPost = useCallback(
    async (slug: string) => {
      if (dirty && !window.confirm('저장하지 않은 변경이 있습니다. 버릴까요?')) {
        return;
      }
      setStatus({ kind: 'busy', text: '불러오는 중…' });
      try {
        const response = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error((await response.json()).error);
        const body = (await response.json()) as LoadedPost;
        setCurrent(body);
        editor?.commands.setContent(body.doc ?? emptyDoc);
        setDirty(false);
        setStatus({ kind: 'idle' });
      } catch (error) {
        setStatus({ kind: 'error', text: String((error as Error).message) });
      }
    },
    [dirty, editor],
  );

  const startNew = useCallback(() => {
    if (dirty && !window.confirm('저장하지 않은 변경이 있습니다. 버릴까요?')) {
      return;
    }
    setCurrent({
      slug: '',
      meta: { title: '', date: today(), tags: [] },
      doc: emptyDoc,
      sha: '',
    });
    editor?.commands.setContent(emptyDoc);
    setDirty(false);
    setStatus({ kind: 'idle' });
  }, [dirty, editor]);

  /* ---------------------------------------------------------------
     저장
     --------------------------------------------------------------- */

  const patchMeta = (patch: Partial<PostMeta>) => {
    setCurrent((post) =>
      post ? { ...post, meta: { ...post.meta, ...patch } } : post,
    );
    setDirty(true);
  };

  const save = useCallback(async () => {
    if (!current || !editor) return;

    const title = current.meta.title.trim();
    if (!title) {
      setStatus({ kind: 'error', text: '제목을 입력해 주세요.' });
      return;
    }

    const slug = current.slug || slugify(title);
    setStatus({ kind: 'busy', text: '저장하는 중…' });

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          meta: { ...current.meta, title },
          doc: editor.getJSON(),
          sha: current.sha || undefined,
        }),
      });

      const body = (await response.json()) as {
        error?: string;
        sha?: string;
        slug?: string;
      };
      if (!response.ok) throw new Error(body.error ?? '저장에 실패했습니다.');

      setCurrent((post) =>
        post ? { ...post, slug: body.slug ?? slug, sha: body.sha ?? '' } : post,
      );
      setDirty(false);
      setStatus({
        kind: 'ok',
        text: '저장했습니다. 1~3분 뒤 사이트에 반영됩니다.',
      });
      await loadList();
    } catch (error) {
      setStatus({ kind: 'error', text: (error as Error).message });
    }
  }, [current, editor, loadList]);

  const unpublish = useCallback(async () => {
    if (!current?.slug) return;
    if (!window.confirm(`"${current.meta.title}" 을(를) 비공개로 돌릴까요?`)) {
      return;
    }

    setStatus({ kind: 'busy', text: '처리하는 중…' });
    try {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(current.slug)}`,
        { method: 'DELETE' },
      );
      const body = (await response.json()) as { error?: string; sha?: string };
      if (!response.ok) throw new Error(body.error ?? '실패했습니다.');

      setCurrent((post) =>
        post
          ? { ...post, sha: body.sha ?? '', meta: { ...post.meta, draft: true } }
          : post,
      );
      setStatus({ kind: 'ok', text: '비공개로 바꿨습니다.' });
      await loadList();
    } catch (error) {
      setStatus({ kind: 'error', text: (error as Error).message });
    }
  }, [current, loadList]);

  /* ---------------------------------------------------------------
     이미지
     --------------------------------------------------------------- */

  const uploadImage = useCallback(
    async (file: File) => {
      if (!current || !editor) return;
      const slug = current.slug || slugify(current.meta.title || 'draft');

      setStatus({ kind: 'busy', text: '이미지 올리는 중…' });
      try {
        const form = new FormData();
        form.append('file', file);

        const response = await fetch(
          `/api/uploads/${encodeURIComponent(slug)}`,
          { method: 'POST', body: form },
        );
        const body = (await response.json()) as { error?: string; url?: string };
        if (!response.ok || !body.url) {
          throw new Error(body.error ?? '업로드에 실패했습니다.');
        }

        editor.chain().focus().setImage({ src: body.url }).run();
        setStatus({
          kind: 'ok',
          text: '이미지를 올렸습니다. 글도 저장해야 반영됩니다.',
        });
      } catch (error) {
        setStatus({ kind: 'error', text: (error as Error).message });
      }
    },
    [current, editor],
  );

  // ⌘S / Ctrl+S 로 저장
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const tagText = useMemo(
    () => (current ? current.meta.tags.join(', ') : ''),
    [current],
  );

  /* ---------------------------------------------------------------
     화면
     --------------------------------------------------------------- */

  if (authFailed) {
    return (
      <div className="empty-state">
        <strong>로그인이 필요합니다.</strong>
        <span>
          이 페이지는 Cloudflare Access로 보호되어 있습니다. 새로고침해서 다시
          로그인해 주세요.
        </span>
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="admin-list">
        <div className="admin-list-head">
          <span className="eyebrow">글 {posts.length}</span>
          <button type="button" className="btn btn-primary" onClick={startNew}>
            새 글
          </button>
        </div>

        <div className="admin-list-body">
          {posts.map((post) => (
            <button
              key={post.slug}
              type="button"
              className="admin-list-item"
              data-active={current?.slug === post.slug}
              onClick={() => openPost(post.slug)}
            >
              <span className="t">{post.meta.title || post.slug}</span>
              <span className="s">
                {post.meta.date}
                {post.meta.draft ? ' · 비공개' : ''}
              </span>
            </button>
          ))}
        </div>

        {email && <p className="admin-user">{email} 로 로그인됨</p>}
      </aside>

      <section className="admin-main">
        {!current ? (
          <div className="empty-state">
            <strong>왼쪽에서 글을 고르거나 새 글을 시작하세요.</strong>
            <span>저장하면 저장소에 커밋되고 사이트가 다시 빌드됩니다.</span>
          </div>
        ) : (
          <>
            <div className="admin-meta">
              <input
                className="admin-title"
                value={current.meta.title}
                onChange={(event) => patchMeta({ title: event.target.value })}
                placeholder="제목"
                aria-label="제목"
              />

              <div className="admin-fields">
                <label>
                  <span>발행일</span>
                  <input
                    type="date"
                    value={current.meta.date}
                    onChange={(event) => patchMeta({ date: event.target.value })}
                  />
                </label>

                <label className="grow">
                  <span>태그 (쉼표로 구분)</span>
                  <input
                    value={tagText}
                    onChange={(event) =>
                      patchMeta({
                        tags: event.target.value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="astro, design"
                  />
                </label>
              </div>

              <label className="block">
                <span>요약 (비우면 본문 앞부분을 씁니다)</span>
                <input
                  value={current.meta.summary ?? ''}
                  onChange={(event) =>
                    patchMeta({ summary: event.target.value })
                  }
                  placeholder="목록과 검색 결과에 보일 한 줄"
                />
              </label>

              <div className="admin-toggles">
                <label className="row">
                  <input
                    type="checkbox"
                    checked={current.meta.draft ?? false}
                    onChange={(event) =>
                      patchMeta({ draft: event.target.checked })
                    }
                  />
                  비공개(초안)
                </label>
                <label className="row">
                  <input
                    type="checkbox"
                    checked={current.meta.featured ?? false}
                    onChange={(event) =>
                      patchMeta({ featured: event.target.checked })
                    }
                  />
                  홈 대표 글
                </label>
                {current.slug && (
                  <span className="admin-slug">/posts/{current.slug}</span>
                )}
              </div>
            </div>

            <Toolbar
              editor={editor}
              onPickImage={() => fileInput.current?.click()}
            />

            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
                event.target.value = '';
              }}
            />

            <div className="admin-editor">
              <EditorContent editor={editor} />
            </div>

            <div className="admin-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={save}
                disabled={status.kind === 'busy'}
              >
                {status.kind === 'busy' ? '처리 중…' : '저장'}
                <kbd className="kbd">⌘S</kbd>
              </button>

              {current.slug && !current.meta.draft && (
                <button type="button" className="btn" onClick={unpublish}>
                  비공개로 돌리기
                </button>
              )}

              {current.slug && (
                <a
                  className="btn btn-ghost"
                  href={`/posts/${current.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  사이트에서 보기
                </a>
              )}

              {dirty && <span className="admin-dirty">저장하지 않은 변경</span>}

              {status.kind !== 'idle' && status.kind !== 'busy' && (
                <span
                  className="admin-status"
                  data-kind={status.kind}
                  role="status"
                >
                  {status.text}
                </span>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

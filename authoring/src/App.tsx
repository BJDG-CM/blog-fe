import { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import History from '@tiptap/extension-history';
import katex from 'katex';
import { FontSize } from './extensions/fontSize';
import { ensureUniqueSlug, slugify } from './utils/slugify';

const apiBase = 'http://localhost:5175';
const fonts = ['Pretendard', 'Noto Sans KR', 'Inter', 'Georgia', 'Courier New', 'Nanum Gothic'];
const fontSizes = ['10', '12', '14', '16', '18', '20', '24', '32', '48'];

type PostMeta = {
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  draft?: boolean;
  summary?: string;
  cover?: string;
};

type PostItem = {
  slug: string;
  meta: PostMeta;
  doc: Record<string, unknown>;
};

const emptyDoc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: '새 글을 작성하세요.' }] }]
};

function renderMath(html: string) {
  let output = html;
  output = output.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
  });
  output = output.replace(/\$([^$\n]+)\$/g, (_, expr) => {
    return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
  });
  return output;
}

export default function App() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [current, setCurrent] = useState<PostItem | null>(null);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState('');

  const loadPosts = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/posts`);
    const items = (await response.json()) as { slug: string; meta: PostMeta }[];
    const full = await Promise.all(
      items.map(async (item) => {
        const detail = await fetch(`${apiBase}/api/posts/${item.slug}`).then((res) => res.json());
        return detail as PostItem;
      })
    );
    setPosts(full);
    if (!current && full.length > 0) {
      setCurrent(full[0]);
    }
  }, [current]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const editor = useEditor({
    extensions: [
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
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      CodeBlock,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link.configure({ openOnClick: false }),
      History
    ],
    content: current?.doc ?? emptyDoc,
    editorProps: {
      handlePaste: (view, event) => handleImagePaste(view, event),
      handleDrop: (view, event) => handleImageDrop(view, event)
    }
  });

  useEffect(() => {
    if (editor && current) {
      editor.commands.setContent(current.doc);
    }
  }, [current, editor]);

  useEffect(() => {
    if (!editor || !current) return;
    const interval = setInterval(() => {
      savePost();
    }, 5000);
    return () => clearInterval(interval);
  });

  const savePost = useCallback(async () => {
    if (!editor || !current) return;
    const payload = {
      ...current,
      meta: {
        ...current.meta,
        updated: new Date().toISOString()
      },
      doc: editor.getJSON()
    };
    await fetch(`${apiBase}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setMessage('자동 저장 완료');
    setTimeout(() => setMessage(''), 1500);
  }, [current, editor]);

  const createNew = () => {
    const existing = new Set(posts.map((post) => post.slug));
    const title = '새 글';
    const base = slugify(title);
    const slug = ensureUniqueSlug(base, existing);
    const newPost: PostItem = {
      slug,
      meta: {
        title,
        date: new Date().toISOString().slice(0, 10),
        tags: [],
        summary: '',
        draft: true
      },
      doc: emptyDoc
    };
    setPosts((prev) => [newPost, ...prev]);
    setCurrent(newPost);
  };

  const deletePost = async () => {
    if (!current) return;
    await fetch(`${apiBase}/api/posts/${current.slug}`, { method: 'DELETE' });
    await loadPosts();
  };

  const uploadImage = async (file: File) => {
    if (!current) return;
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${apiBase}/api/uploads/${current.slug}`, {
      method: 'POST',
      body: formData
    });
    const data = (await response.json()) as { url: string };
    editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run();
  };

  const handleImagePaste = (_view: unknown, event: ClipboardEvent) => {
    const files = Array.from(event.clipboardData?.files ?? []);
    const image = files.find((file) => file.type.startsWith('image/'));
    if (image) {
      void uploadImage(image);
      return true;
    }
    return false;
  };

  const handleImageDrop = (_view: unknown, event: DragEvent) => {
    const files = Array.from(event.dataTransfer?.files ?? []);
    const image = files.find((file) => file.type.startsWith('image/'));
    if (image) {
      void uploadImage(image);
      return true;
    }
    return false;
  };

  const htmlPreview = useMemo(() => {
    if (!editor) return '';
    return renderMath(editor.getHTML());
  }, [editor, preview]);

  if (!current) {
    return (
      <div>
        <header>블로그 작성</header>
        <div className="app">
          <aside className="sidebar">
            <button type="button" onClick={createNew}>
              새 글
            </button>
          </aside>
          <section className="editor-area">로딩 중...</section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header>블로그 작성</header>
      <div className="app">
        <aside className="sidebar">
          <button type="button" onClick={createNew}>
            새 글
          </button>
          <div className="post-list" style={{ marginTop: '1rem' }}>
            {posts.map((post) => (
              <button
                key={post.slug}
                type="button"
                className={post.slug === current.slug ? '' : 'secondary'}
                onClick={() => setCurrent(post)}
              >
                {post.meta.title}
              </button>
            ))}
          </div>
        </aside>
        <section className="editor-area">
          <div className="notice">
            <strong>자동 저장:</strong> 5초마다 로컬 파일로 저장됩니다.
          </div>
          {message && <p>{message}</p>}
          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
            <input
              value={current.meta.title}
              onChange={(event) =>
                setCurrent({
                  ...current,
                  meta: { ...current.meta, title: event.target.value }
                })
              }
              placeholder="제목"
              aria-label="제목"
            />
            <textarea
              value={current.meta.summary ?? ''}
              onChange={(event) =>
                setCurrent({
                  ...current,
                  meta: { ...current.meta, summary: event.target.value }
                })
              }
              placeholder="요약"
              aria-label="요약"
            />
            <input
              value={current.meta.tags.join(',')}
              onChange={(event) =>
                setCurrent({
                  ...current,
                  meta: { ...current.meta, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }
                })
              }
              placeholder="태그 (쉼표 구분)"
              aria-label="태그"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={!current.meta.draft}
                onChange={(event) =>
                  setCurrent({
                    ...current,
                    meta: { ...current.meta, draft: !event.target.checked }
                  })
                }
              />
              게시됨
            </label>
          </div>
          <div className="toolbar">
            <select
              onChange={(event) => editor?.chain().focus().setFontFamily(event.target.value).run()}
              aria-label="글꼴"
            >
              <option value="">글꼴</option>
              {fonts.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <select
              onChange={(event) => editor?.chain().focus().setMark('textStyle', { fontSize: event.target.value }).run()}
              aria-label="글자 크기"
            >
              <option value="">크기</option>
              {fontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <input
              type="color"
              onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
              aria-label="글자 색상"
            />
            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}>
              Bold
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}>
              Italic
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()}>
              Underline
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()}>
              Strike
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('left').run()}>
              좌
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('center').run()}>
              중
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('right').run()}>
              우
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('justify').run()}>
              양쪽
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
              불릿
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
              번호
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
              인용
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
              코드
            </button>
            <button type="button" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              표
            </button>
            <button type="button" onClick={() => editor?.chain().focus().addColumnAfter().run()}>
              열+
            </button>
            <button type="button" onClick={() => editor?.chain().focus().addRowAfter().run()}>
              행+
            </button>
            <button type="button" onClick={() => editor?.chain().focus().deleteColumn().run()}>
              열-
            </button>
            <button type="button" onClick={() => editor?.chain().focus().deleteRow().run()}>
              행-
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleHeaderRow().run()}>
              헤더
            </button>
            <button type="button" onClick={() => editor?.chain().focus().undo().run()}>
              실행취소
            </button>
            <button type="button" onClick={() => editor?.chain().focus().redo().run()}>
              다시실행
            </button>
            <button type="button" className="secondary" onClick={() => setPreview((prev) => !prev)}>
              {preview ? '편집' : '미리보기'}
            </button>
            <button type="button" className="secondary" onClick={deletePost}>
              삭제
            </button>
            <label>
              이미지 업로드
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadImage(file);
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="secondary"
              onClick={() => editor?.chain().focus().insertContent('$$수식 입력$$').run()}
            >
              수식 삽입
            </button>
          </div>
          {!preview && <EditorContent editor={editor} className="editor-content" />}
          {preview && <div className="preview" dangerouslySetInnerHTML={{ __html: htmlPreview }} />}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={savePost}>
              저장
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

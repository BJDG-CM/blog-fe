import type { Editor } from '@tiptap/react';

type Props = {
  editor: Editor | null;
  onPickImage: () => void;
};

const HEADINGS = [1, 2, 3] as const;

export default function Toolbar({ editor, onPickImage }: Props) {
  if (!editor) return null;

  const button = (
    label: string,
    title: string,
    active: boolean,
    action: () => void,
  ) => (
    <button
      type="button"
      className="admin-tool"
      data-active={active}
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={action}
    >
      {label}
    </button>
  );

  return (
    <div className="admin-toolbar" role="toolbar" aria-label="서식">
      <div className="group">
        {button('P', '본문', editor.isActive('paragraph'), () =>
          editor.chain().focus().setParagraph().run(),
        )}
        {HEADINGS.map((level) =>
          button(
            `H${level}`,
            `제목 ${level}`,
            editor.isActive('heading', { level }),
            () => editor.chain().focus().toggleHeading({ level }).run(),
          ),
        )}
      </div>

      <div className="group">
        {button('B', '굵게', editor.isActive('bold'), () =>
          editor.chain().focus().toggleBold().run(),
        )}
        {button('I', '기울임', editor.isActive('italic'), () =>
          editor.chain().focus().toggleItalic().run(),
        )}
        {button('U', '밑줄', editor.isActive('underline'), () =>
          editor.chain().focus().toggleUnderline().run(),
        )}
        {button('S', '취소선', editor.isActive('strike'), () =>
          editor.chain().focus().toggleStrike().run(),
        )}
      </div>

      <div className="group">
        {button('• 목록', '글머리 목록', editor.isActive('bulletList'), () =>
          editor.chain().focus().toggleBulletList().run(),
        )}
        {button('1. 목록', '번호 목록', editor.isActive('orderedList'), () =>
          editor.chain().focus().toggleOrderedList().run(),
        )}
        {button('인용', '인용구', editor.isActive('blockquote'), () =>
          editor.chain().focus().toggleBlockquote().run(),
        )}
        {button('코드', '코드 블록', editor.isActive('codeBlock'), () =>
          editor.chain().focus().toggleCodeBlock().run(),
        )}
      </div>

      <div className="group">
        {button('표', '표 넣기', editor.isActive('table'), () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        )}
        {button('구분선', '구분선', false, () =>
          editor.chain().focus().setHorizontalRule().run(),
        )}
        {button('이미지', '이미지 올리기', false, onPickImage)}
        {button('링크', '링크', editor.isActive('link'), () => {
          const previous = editor.getAttributes('link').href as
            | string
            | undefined;
          const url = window.prompt('링크 주소', previous ?? 'https://');
          if (url === null) return;
          if (url === '') {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
        })}
      </div>

      <div className="group">
        {button('왼쪽', '왼쪽 정렬', editor.isActive({ textAlign: 'left' }), () =>
          editor.chain().focus().setTextAlign('left').run(),
        )}
        {button(
          '가운데',
          '가운데 정렬',
          editor.isActive({ textAlign: 'center' }),
          () => editor.chain().focus().setTextAlign('center').run(),
        )}
        {button(
          '오른쪽',
          '오른쪽 정렬',
          editor.isActive({ textAlign: 'right' }),
          () => editor.chain().focus().setTextAlign('right').run(),
        )}
      </div>

      <div className="group">
        {button('되돌리기', '되돌리기', false, () =>
          editor.chain().focus().undo().run(),
        )}
        {button('다시', '다시 실행', false, () =>
          editor.chain().focus().redo().run(),
        )}
      </div>
    </div>
  );
}

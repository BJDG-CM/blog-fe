import { useState, type FormEvent } from 'react';
import DOMPurify from 'dompurify';
import katex from 'katex';
import type { EncryptedPayload } from '../utils/crypto';
import { decryptJson } from '../utils/crypto';
import { renderTiptapToHtml } from '../utils/tiptap';

const STORAGE_KEY = 'blog-passphrase';

function renderMath(html: string) {
  let output = html;
  output = output.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) =>
    katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }),
  );
  output = output.replace(/\$([^$\n]+)\$/g, (_, expr) =>
    katex.renderToString(expr.trim(), {
      displayMode: false,
      throwOnError: false,
    }),
  );
  return output;
}

export default function PrivatePost({ payload }: { payload: EncryptedPayload }) {
  const stored =
    typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) ?? '')
      : '';

  const [passphrase, setPassphrase] = useState(stored);
  const [remember, setRemember] = useState(Boolean(stored));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [html, setHtml] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!passphrase || busy) return;

    setBusy(true);
    try {
      const doc = await decryptJson(passphrase, payload);
      const rendered = renderTiptapToHtml(doc as Record<string, unknown>);
      setHtml(DOMPurify.sanitize(renderMath(rendered)));
      setError('');

      if (remember) localStorage.setItem(STORAGE_KEY, passphrase);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      setError('패스프레이즈가 올바르지 않습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (html) {
    return <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className="private-gate">
      <span className="lock" aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
          <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        </svg>
      </span>

      <div>
        <h2>비공개 글입니다</h2>
        <p style={{ marginTop: 8 }}>
          본문이 AES-GCM으로 암호화되어 있습니다. 패스프레이즈를 입력하면
          브라우저에서 바로 복호화됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="패스프레이즈"
          aria-label="패스프레이즈"
          autoComplete="current-password"
        />

        <label className="row">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          이 기기에서만 기억하기
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? '복호화 중…' : '본문 열기'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>

      <p>
        정적 사이트에서는 완전한 접근 통제가 불가능합니다. 평문 노출을 막기 위한
        보호 수단으로만 사용하세요.
      </p>
    </div>
  );
}

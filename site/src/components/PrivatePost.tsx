import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import katex from 'katex';
import type { EncryptedPayload } from '../utils/crypto';
import { decryptJson } from '../utils/crypto';
import { renderTiptapToHtml } from '../utils/tiptap';

const storageKey = 'blog-passphrase';

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

export default function PrivatePost({ payload }: { payload: EncryptedPayload }) {
  const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) ?? '' : '';
  const [passphrase, setPassphrase] = useState(stored);
  const [remember, setRemember] = useState(Boolean(stored));
  const [error, setError] = useState('');
  const [html, setHtml] = useState('');

  const decrypted = useMemo(() => html, [html]);

  const handleDecrypt = async () => {
    try {
      const doc = await decryptJson(passphrase, payload);
      const rendered = renderTiptapToHtml(doc as Record<string, unknown>);
      const withMath = renderMath(rendered);
      setHtml(DOMPurify.sanitize(withMath));
      setError('');
      if (remember) {
        localStorage.setItem(storageKey, passphrase);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      setError('패스프레이즈가 올바르지 않습니다.');
    }
  };

  if (decrypted) {
    return <div className="post-content" dangerouslySetInnerHTML={{ __html: decrypted }} />;
  }

  return (
    <section className="card">
      <h2>비공개 글입니다</h2>
      <p>정적 사이트의 완전한 접근통제는 불가하며, 이 방식은 콘텐츠 평문 노출 방지를 위한 클라이언트 측 암호화입니다.</p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <input
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="패스프레이즈 입력"
          aria-label="패스프레이즈 입력"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          이 기기에서만 기억
        </label>
        <button type="button" onClick={handleDecrypt}>
          복호화
        </button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </div>
    </section>
  );
}

import { describe, expect, it } from 'vitest';
import { enhanceHtml } from '../render';

describe('enhanceHtml', () => {
  it('헤딩에 id와 앵커를 붙이고 목차를 만든다', async () => {
    const { html, toc } = await enhanceHtml(
      '<h2>첫 번째 절</h2><p>본문</p><h3>세부 항목</h3>',
    );

    expect(toc).toEqual([
      { depth: 2, text: '첫 번째 절', slug: '첫-번째-절' },
      { depth: 3, text: '세부 항목', slug: '세부-항목' },
    ]);
    expect(html).toContain('<h2 id="첫-번째-절"');
    expect(html).toContain('class="anchor"');
  });

  it('제목이 겹치면 슬러그에 번호를 붙인다', async () => {
    const { toc } = await enhanceHtml('<h2>정리</h2><h2>정리</h2>');
    expect(toc.map((entry) => entry.slug)).toEqual(['정리', '정리-2']);
  });

  it('표를 가로 스크롤 래퍼로 감싼다', async () => {
    const { html } = await enhanceHtml('<table><tr><td>값</td></tr></table>');
    expect(html).toContain('<div class="table-wrapper"><table>');
  });

  it('이미지에 lazy loading 속성을 넣는다', async () => {
    const { html } = await enhanceHtml('<img src="/a.png" alt="설명">');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });

  it('코드 블록을 shiki로 하이라이팅하고 복사 버튼을 붙인다', async () => {
    const { html } = await enhanceHtml(
      '<pre><code class="language-typescript">const answer = 42;</code></pre>',
    );

    expect(html).toContain('class="code-block"');
    expect(html).toContain('data-copy');
    expect(html).toContain('--shiki-light');
    // 이스케이프된 소스가 원문으로 복원되어 하이라이팅된다
    expect(html).toContain('42');
  });

  it('모르는 언어는 일반 텍스트로 처리한다', async () => {
    const { html } = await enhanceHtml(
      '<pre><code class="language-brainfuck">+++</code></pre>',
    );
    expect(html).toContain('class="code-block"');
    expect(html).toContain('>code<');
  });
});

import { describe, expect, it, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import { decryptJson, encryptJson } from '../crypto';

beforeAll(() => {
  // Node 20+ 에서 globalThis.crypto 는 getter 전용이라 직접 대입할 수 없다.
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true,
    });
  }
  globalThis.btoa = (data: string) =>
    Buffer.from(data, 'binary').toString('base64');
  globalThis.atob = (data: string) =>
    Buffer.from(data, 'base64').toString('binary');
});

describe('crypto', () => {
  it('encrypts and decrypts payload', async () => {
    const payload = { message: 'hello' };
    const encrypted = await encryptJson('passphrase', payload);
    const decrypted = await decryptJson<{ message: string }>(
      'passphrase',
      encrypted,
    );
    expect(decrypted.message).toBe('hello');
  });
});

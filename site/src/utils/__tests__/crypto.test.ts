import { describe, expect, it, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import { decryptJson, encryptJson } from '../crypto';

beforeAll(() => {
  // @ts-expect-error node global
  globalThis.crypto = webcrypto;
  // @ts-expect-error node global
  globalThis.btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
  // @ts-expect-error node global
  globalThis.atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
});

describe('crypto', () => {
  it('encrypts and decrypts payload', async () => {
    const payload = { message: 'hello' };
    const encrypted = await encryptJson('passphrase', payload);
    const decrypted = await decryptJson<{ message: string }>('passphrase', encrypted);
    expect(decrypted.message).toBe('hello');
  });
});

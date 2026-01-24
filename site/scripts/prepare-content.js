import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const privateMode = process.env.PUBLIC_PRIVATE_MODE === 'true';
const passphrase = process.env.PRIVATE_PASSPHRASE ?? '';

if (!privateMode) {
  process.exit(0);
}

if (!passphrase) {
  throw new Error('PRIVATE_PASSPHRASE is required when PUBLIC_PRIVATE_MODE=true');
}

const postsDir = path.resolve('src/content/posts');
const encryptedDir = path.resolve('src/content/encrypted');

const encoder = new TextEncoder();

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

async function deriveKey(passphraseValue, salt) {
  const keyMaterial = await crypto.webcrypto.subtle.importKey(
    'raw',
    encoder.encode(passphraseValue),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptJson(payload) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encoded = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext)
  };
}

const files = await readDirSafe(postsDir);
await mkdir(encryptedDir, { recursive: true });

for (const file of files) {
  if (!file.endsWith('.json')) continue;
  const fullPath = path.join(postsDir, file);
  const contents = await readFile(fullPath, 'utf-8');
  const json = JSON.parse(contents);
  const encrypted = await encryptJson(json.doc);
  const outPath = path.join(encryptedDir, file);
  await writeFile(outPath, JSON.stringify(encrypted, null, 2));
}

async function readDirSafe(directory) {
  try {
    const entries = await (await import('node:fs/promises')).readdir(directory);
    return entries;
  } catch {
    return [];
  }
}

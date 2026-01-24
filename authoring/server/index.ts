import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import multer from 'multer';

const app = express();
const port = 5175;

const repoRoot = path.resolve(process.cwd(), '..');
const postsDir = path.join(repoRoot, 'site', 'src', 'content', 'posts');
const uploadsDir = path.join(repoRoot, 'site', 'public', 'uploads');

const upload = multer({ dest: path.join(repoRoot, '.tmp') });

app.use(express.json({ limit: '10mb' }));
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/posts', async (_req, res) => {
  const files = await safeReadDir(postsDir);
  const items = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const contents = await fs.readFile(path.join(postsDir, file), 'utf-8');
        const json = JSON.parse(contents);
        return { slug: json.slug, meta: json.meta };
      })
  );
  res.json(items);
});

app.get('/api/posts/:slug', async (req, res) => {
  const filePath = path.join(postsDir, `${req.params.slug}.json`);
  try {
    const contents = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(contents));
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

app.post('/api/posts', async (req, res) => {
  const { slug, meta, doc } = req.body as { slug: string; meta: Record<string, unknown>; doc: unknown };
  if (!slug || !meta || !doc) {
    res.status(400).json({ error: 'invalid payload' });
    return;
  }
  const filePath = path.join(postsDir, `${slug}.json`);
  const payload = { slug, meta, doc };
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
  res.json({ ok: true });
});

app.delete('/api/posts/:slug', async (req, res) => {
  const filePath = path.join(postsDir, `${req.params.slug}.json`);
  try {
    const contents = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(contents);
    json.meta = { ...json.meta, draft: true, deleted: true };
    await fs.writeFile(filePath, JSON.stringify(json, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

app.post('/api/uploads/:slug', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'file missing' });
    return;
  }
  const destDir = path.join(uploadsDir, req.params.slug);
  await fs.mkdir(destDir, { recursive: true });
  const ext = path.extname(req.file.originalname) || '.png';
  const fileName = `${Date.now()}${ext}`;
  const destPath = path.join(destDir, fileName);
  await fs.rename(req.file.path, destPath);
  res.json({ url: `/uploads/${req.params.slug}/${fileName}` });
});

app.listen(port, () => {
  console.log(`Authoring server listening on http://localhost:${port}`);
});

async function safeReadDir(dir: string) {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

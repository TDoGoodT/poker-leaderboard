import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { extname, resolve } from 'node:path';
import { z } from 'zod';
import { getDataset, getCounts, saveGame } from './repository';
import './db';
import './seed';

const transactionSchema = z.object({
  payer: z.string().trim().min(1),
  receiver: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  raw: z.string().optional(),
});

const createGameSchema = z.object({
  date: z.string().datetime().optional(),
  rawMessage: z.string().optional(),
  sender: z.string().optional(),
  transactions: z.array(transactionSchema).min(1),
});

const app = new Hono();
const webBuildRoot = resolve(process.cwd(), 'dist/web');

app.use('/api/*', cors({ origin: '*' }));

// Auth middleware for state-modifying requests
app.use('/api/*', async (c, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method)) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const auth = c.req.header('Authorization');
      if (!auth || auth !== `Bearer ${adminPassword}`) {
        return c.json({ ok: false, error: 'Unauthorized' }, 401);
      }
    } else {
      console.warn("ADMIN_PASSWORD not set in env, allowing request unconditionally");
    }
  }
  await next();
});

app.get('/api/health', (c) => {
  const counts = getCounts();

  return c.json({
    ok: true,
    ...counts,
  });
});

app.get('/api/data', (c) => {
  const dataset = getDataset();
  return c.json(dataset);
});

app.post('/api/games', async (c) => {
  const body = await c.req.json();
  const parsed = createGameSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        error: 'Invalid payload',
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const normalized = parsed.data;

  if (normalized.transactions.some((tx) => tx.payer === tx.receiver)) {
    return c.json({ ok: false, error: 'Payer and receiver must be different.' }, 400);
  }

  const id = saveGame({
    date: normalized.date ?? new Date().toISOString(),
    rawMessage: normalized.rawMessage ?? '',
    sender: normalized.sender ?? 'manual-web',
    transactions: normalized.transactions,
  });

  return c.json({ ok: true, id }, 201);
});

app.get('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.notFound();
  }

  const relativePath = c.req.path === '/' ? 'index.html' : c.req.path.slice(1);
  const absolutePath = resolve(webBuildRoot, relativePath);

  if (!absolutePath.startsWith(webBuildRoot)) {
    return c.notFound();
  }

  const file = Bun.file(absolutePath);
  if (await file.exists()) {
    return c.body(file);
  }

  // SPA fallback for client-side routes.
  if (!extname(c.req.path)) {
    const indexFile = Bun.file(resolve(webBuildRoot, 'index.html'));
    if (await indexFile.exists()) {
      return c.body(indexFile);
    }
  }

  return c.notFound();
});

const port = Number(process.env.PORT ?? 3001);

console.log(`Podium API listening on http://localhost:${port}`);

Bun.serve({
  port,
  fetch: app.fetch,
});

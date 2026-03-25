import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { cors } from 'hono/cors';
import { extname, resolve } from 'node:path';
import { z } from 'zod';
import { getDataset, getCounts, saveGame, updateGame, deleteGame, upsertPlayer } from './repository';
import './db';
import './seed';

const entrySchema = z.object({
  player: z.string().trim().min(1),
  buyIn: z.coerce.number().min(0),
  cashOut: z.coerce.number().min(0),
});

const transactionSchema = z.object({
  payer: z.string().trim().min(1),
  receiver: z.string().trim().min(1),
  amount: z.coerce.number().min(0),
  raw: z.string().optional(),
});

const createGameSchema = z.object({
  date: z.string().datetime().optional(),
  rawMessage: z.string().optional(),
  sender: z.string().optional(),
  entries: z.array(entrySchema).optional(),
  transactions: z.array(transactionSchema),
});

const app = new Hono();
const webBuildRoot = resolve(process.cwd(), 'dist/web');

app.use('/api/*', cors({ origin: '*' }));

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'fallback-secret';

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
     return c.json({ ok: true, token: 'no-password-required' });
  }
  
  if (body.password === adminPassword) {
    const payload = {
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    }
    const token = await sign(payload, JWT_SECRET);
    return c.json({ ok: true, token });
  }
  
  return c.json({ ok: false, error: 'Invalid password' }, 401);
});

// Auth middleware for state-modifying requests
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/auth/login') {
    return next();
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method)) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const auth = c.req.header('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) {
        return c.json({ ok: false, error: 'Unauthorized' }, 401);
      }
      
      const token = auth.split(' ')[1];
      try {
        await verify(token, JWT_SECRET, 'HS256');
      } catch (e) {
        return c.json({ ok: false, error: 'Invalid or expired token' }, 401);
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

app.post('/api/players', async (c) => {
  const body = await c.req.json();
  const name = body.name?.trim();
  
  if (!name) {
    return c.json({ ok: false, error: 'Name is required' }, 400);
  }

  const id = upsertPlayer(name);
  return c.json({ ok: true, id, name }, 201);
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

  if (!normalized.entries?.length && !normalized.transactions.length) {
    return c.json({ ok: false, error: 'Game must include entries or transactions.' }, 400);
  }

  if ((normalized.sender ?? 'manual-web') === 'manual-web' && !normalized.entries?.length) {
    return c.json({ ok: false, error: 'Manual games must include buy-in and cash-out entries.' }, 400);
  }

  if (normalized.transactions.some((tx) => tx.payer === tx.receiver)) {
    return c.json({ ok: false, error: 'Payer and receiver must be different.' }, 400);
  }

  const id = saveGame({
    date: normalized.date ?? new Date().toISOString(),
    rawMessage: normalized.rawMessage ?? '',
    sender: normalized.sender ?? 'manual-web',
    entries: normalized.entries,
    transactions: normalized.transactions,
  });

  return c.json({ ok: true, id }, 201);
});

app.put('/api/games/:id', async (c) => {
  const id = c.req.param('id');
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

  if (!normalized.entries?.length && !normalized.transactions.length) {
    return c.json({ ok: false, error: 'Game must include entries or transactions.' }, 400);
  }

  if ((normalized.sender ?? 'manual-web') === 'manual-web' && !normalized.entries?.length) {
    return c.json({ ok: false, error: 'Manual games must include buy-in and cash-out entries.' }, 400);
  }

  if (normalized.transactions.some((tx) => tx.payer === tx.receiver)) {
    return c.json({ ok: false, error: 'Payer and receiver must be different.' }, 400);
  }

  const success = updateGame(id, {
    date: normalized.date ?? new Date().toISOString(),
    rawMessage: normalized.rawMessage ?? '',
    sender: normalized.sender ?? 'manual-web',
    entries: normalized.entries,
    transactions: normalized.transactions,
  });

  if (!success) {
    return c.json({ ok: false, error: 'Game not found' }, 404);
  }

  return c.json({ ok: true, id });
});

app.delete('/api/games/:id', async (c) => {
  const id = c.req.param('id');
  const success = deleteGame(id);

  if (!success) {
    return c.json({ ok: false, error: 'Game not found' }, 404);
  }

  return c.json({ ok: true, id });
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

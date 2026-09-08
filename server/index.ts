import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UpstreamError } from './provider.js';
import { resolveProvider } from './providers.js';
import { RateLimiter } from './rate-limit.js';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  RATE_LIMIT_WINDOW_MS,
  type ApiErrorBody,
  type RemediateRequest,
} from '../src/shared/remediation.types.js';

const PORT = Number(process.env.PORT ?? 8787);
const DIST_DIR = path.resolve(fileURLToPath(new URL('../dist', import.meta.url)));

// Base64 inflates by 4/3; allow headroom for the JSON envelope.
const JSON_LIMIT = `${Math.ceil((MAX_IMAGE_BYTES * 4) / 3 / 1024 / 1024) + 2}mb`;

const provider = await resolveProvider();

const limiter = new RateLimiter();
setInterval(() => limiter.prune(), RATE_LIMIT_WINDOW_MS).unref();

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

function decodedByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: JSON_LIMIT }));

app.get('/api/health', async (_req, res) => {
  const status = await provider.check();
  res.json({ ok: status.ok, provider: provider.name, model: provider.model, detail: status.detail });
});

app.post('/api/remediate', async (req, res) => {
  const fail = (status: number, body: ApiErrorBody) => res.status(status).json(body);

  const limit = limiter.check(req.ip ?? 'unknown');
  if (!limit.allowed) {
    res.set('Retry-After', String(limit.retryAfterSeconds));
    return fail(429, {
      error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.`,
      code: 'rate_limited',
    });
  }

  const { image, mimeType } = (req.body ?? {}) as Partial<RemediateRequest>;

  if (typeof image !== 'string' || !image || typeof mimeType !== 'string') {
    return fail(400, { error: 'Request must include `image` and `mimeType`.', code: 'bad_request' });
  }
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return fail(400, { error: `Unsupported mime type: ${mimeType}`, code: 'unsupported_type' });
  }
  if (!BASE64_RE.test(image)) {
    return fail(400, { error: '`image` must be raw base64 without a data URL prefix.', code: 'bad_request' });
  }
  if (decodedByteLength(image) > MAX_IMAGE_BYTES) {
    return fail(413, {
      error: `Image exceeds the ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB limit.`,
      code: 'too_large',
    });
  }

  try {
    res.json(await provider.remediateImage(image, mimeType));
  } catch (error) {
    if (error instanceof UpstreamError) {
      console.error('Remediation failed:', error.message, error.cause ?? '');
      return fail(error.status, {
        error: error.message,
        code: error.status === 429 ? 'rate_limited' : 'upstream_error',
      });
    }
    console.error('Unexpected remediation error:', error);
    return fail(500, { error: 'Unexpected server error.', code: 'upstream_error' });
  }
});

// Serve the built frontend when it exists, so production is a single origin.
app.use(express.static(DIST_DIR));
app.get(/^(?!\/api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) next();
  });
});

const server = app.listen(PORT, async () => {
  console.log(
    `API listening on http://localhost:${PORT} using ${provider.name} (${provider.model}), ` +
      `request timeout ${Math.round(server.requestTimeout / 1000)}s`,
  );
  const status = await provider.check();
  console[status.ok ? 'log' : 'warn'](`${status.ok ? 'Ready' : 'NOT READY'}: ${status.detail}`);
});

// The request timeout has to outlast whichever provider is actually running: a
// local vision model can take minutes per page, while a hosted one should not be
// governed by the local model's much longer allowance. It stays finite — 0 would
// mean "never", which hands any client an unbounded open connection.
server.requestTimeout = provider.timeoutMs + 30_000;

// Headers arrive quickly no matter how slow generation is, so this keeps its
// default — it is the Slowloris defense.

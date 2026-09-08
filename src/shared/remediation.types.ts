export interface Formula {
  description: string;
  latex: string;
  mathml: string;
}

export interface RemediationResult {
  originalText: string;
  formulas: Formula[];
}

export interface RemediateRequest {
  /** Base64-encoded image bytes, without the `data:` URL prefix. */
  image: string;
  mimeType: string;
}

export interface ApiErrorBody {
  error: string;
  /** Stable code the client can branch on without parsing prose. */
  code: 'bad_request' | 'unsupported_type' | 'too_large' | 'rate_limited' | 'upstream_error';
}

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Max decoded image bytes accepted by the proxy. Keeps a single upload from burning the quota. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Max PDF pages analyzed per upload. Each page is one model call, so this is
 * also the number of requests a single upload makes — the server's rate limit
 * is derived from it so one legitimate upload can never exhaust the budget.
 */
export const MAX_PDF_PAGES = 10;

/** Uploads a single client may complete per rate-limit window. */
export const MAX_UPLOADS_PER_WINDOW = 3;

export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Request budget per window: enough for MAX_UPLOADS_PER_WINDOW full-length PDFs. */
export const RATE_LIMIT_MAX = MAX_PDF_PAGES * MAX_UPLOADS_PER_WINDOW;

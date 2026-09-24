# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries under a **Planned** heading describe work that has not landed yet; they
are kept here so the roadmap and the history share one file.

## [Unreleased]

Hardening pass from a full-repository review. No feature work — these are
defects and gaps in what already ships.

### Security

- Trust the reverse proxy explicitly when resolving the client IP for rate
  limiting. `RateLimiter` keys on `req.ip`, which behind Render, Fly, nginx or
  Cloudflare resolves to the proxy rather than the caller, collapsing every
  visitor into a single 30-request/minute bucket — one user's 10-page PDF
  rate-limits the entire service. Set the platform's real hop count via
  `app.set('trust proxy', n)` behind an env var so direct-exposure and local
  runs keep the socket address, rather than `true`, which makes
  `X-Forwarded-For` spoofable and the limiter bypassable per request.
  (`server/index.ts`)

### Fixed

- Size the HTTP request timeout to cover retries. `server.requestTimeout` was
  derived from a single attempt (`provider.timeoutMs + 30s`) while `withRetry`
  makes up to three, each with its own full `AbortSignal.timeout` — an Ollama
  worst case of roughly 900s against a 330s request timeout, so the socket is
  torn down mid-retry and the client receives a dropped connection instead of
  the error JSON it knows how to handle. (`server/index.ts`)
- Stop retrying `UpstreamError`. `isRetryable` matches any object carrying a
  `.status`, and `UpstreamError` carries one, so a missing `API_KEY` (500) and a
  request timeout (502) thrown *inside* `withRetry` were retried three times —
  tripling every timeout and re-attempting configuration errors that cannot
  succeed. (`server/retry.ts`)
- Deduplicate in-flight health probes. `CheckCache` stored only settled results,
  so N concurrent `/api/health` requests produced N billable Gemini
  generations — the exact amplification the cache exists to prevent. Memoize the
  promise, not the result. (`server/provider.ts`)
- Convert remaining mathematical Unicode on export. `unicodeToTextLatex` maps
  only its `SYMBOLS` table; anything outside it reaches the `.tex` intact and
  aborts `pdflatex` under `inputenc`, which is the failure the function exists to
  prevent. Add a catch-all pass over leftover non-ASCII codepoints.
  (`src/shared/latex-normalize.ts`)
- Guard image size in the browser. A dense scan rendered at `PDF_RENDER_SCALE`
  2.0 exceeds the server's 8MB `MAX_IMAGE_BYTES`, so the page 413s and is
  reported only as an unexplained "could not be analyzed". Re-render at a lower
  scale when the encoded payload is over the limit. (`src/app.component.ts`)
- Verify the `RIFF` magic at offset 0 when sniffing WebP uploads; the signature
  check read only `WEBP` at offset 8, admitting any file with those bytes in that
  position. (`src/app.component.ts`)
- Clear `uploadedImages` on the failure path, so a later partial success no
  longer exports figure pages belonging to a discarded run.
  (`src/app.component.ts`)
- Find the failing line in the pdflatex log. The compile harness split on
  `os.EOL`, but pdflatex writes `\n` even on Windows, so every failure was
  reported as "unknown error". (`e2e/compile.ts`)
- Reject base64 whose length is not a multiple of four, which made
  `decodedByteLength` return a fractional size. (`server/index.ts`)

### Changed

- Build the exported `.tex` from one shared function. `e2e/compile.ts`
  duplicated `exportToLatex` and had already drifted — no `\author`, and
  `\includegraphics[width=\textwidth]` against the app's
  `[width=\textwidth,height=\textheight,keepaspectratio]` — so the compile proof
  covered a document the app never emits. (`src/latex.ts`, `e2e/compile.ts`)
- Retry the OpenAI temperature fallback inline instead of throwing a synthetic
  503, which consumed one of three attempts plus a backoff sleep.
  (`server/openai.ts`)
- Emit `X-RateLimit-Remaining`; the limiter computed `remaining` and discarded
  it. (`server/index.ts`)
- Export the `.tex` blob as `application/x-tex` rather than the unregistered
  `text/latex`. (`src/app.component.ts`)

## [0.3.0] — Planned — Correctness and trust

Close the gap between "the model answered" and "the answer is right and usable".

### Added

- **HTML export with embedded MathML.** The tool is an accessibility remediator
  that currently emits only `.tex`, a format no screen reader consumes. HTML plus
  the MathML already generated and sanitized is directly consumable by NVDA, JAWS
  and VoiceOver. No new dependencies.
- **Inline formula placement.** `RemediationResult` keeps `originalText` and
  `formulas` disjoint, so the export prints all prose and then all formulas,
  destroying the reading order of the page. Have the model emit `[FORMULA_n]`
  placeholders inside `originalText` and substitute display math at each marker
  on export.
- **Per-formula editing with live preview.** Vision models misread subscripts and
  there is currently no way to correct one; results render read-only. A
  remediation tool without a correction step is a demo, not a workflow.
- **Client-side LaTeX validation and review flags.** Parse each formula with
  KaTeX in the browser and badge the failures, plus any formula that
  `normalizeLatex` had to rewrite — those are where the model was laziest. Today a
  bad formula surfaces only after the user downloads the `.tex` and runs pdflatex.
- **Content-addressed result cache.** Keyed on the SHA-256 of the image payload
  and checked before `provider.remediateImage`; re-uploading the same PDF
  currently re-spends the entire free-tier quota.

### Changed

- **Derive MathML from the LaTeX** (temml or MathJax) instead of asking the model
  for both representations independently, which lets them disagree with nothing
  to catch it. Removes a class of silent correctness bug and roughly halves
  output tokens.

## [0.4.0] — Planned — Measurement

The repository cannot currently produce a single number about its own quality.

### Added

- Labelled benchmark set of 100–150 formulas spanning clean typeset, dense
  multi-column, handwritten and chemical notation.
- Math-aware accuracy metric: normalize both sides to MathML and compare trees,
  rather than diffing LaTeX strings.
- CI matrix running the benchmark across every backend behind
  `RemediationProvider`, with results published in the README.
- Load test demonstrating the pacer and retry classifier under burst traffic,
  quantifying the 429s avoided.

## [0.5.0] — Planned — Local formula detection

### Added

- Local layout/formula detection (Surya or PP-DocLayout via `onnxruntime-node`)
  over the canvas pdf.js already renders, sending cropped regions instead of
  whole pages. Cuts vision tokens, improves accuracy on dense pages, and yields
  bounding boxes.
- Hover-to-highlight linking each result to its region on the source page, built
  on those boxes.

## [0.6.0] — Planned — Output verification

### Added

- Visual round-trip verification: re-render the returned LaTeX (MathJax → SVG →
  raster) and compare it against the cropped source region with SSIM, producing a
  per-formula confidence score grounded in pixels rather than in the model's own
  report.

## [0.7.0] — Planned — Accessibility conformance

### Added

- EPUB3 export with embedded MathML, validated with DAISY Ace in CI. (Tagged
  PDF/UA from LaTeX remains too unreliable to promise.)
- axe-core audit of the application's own interface in CI.

## [0.2.0] — 2026-09-07

Moved every model call off the client. The previous release shipped the Gemini
key to the browser.

### Security

- The API key is read only by the backend and is never bundled into the
  frontend. The browser posts page images to `POST /api/remediate` instead of
  calling Gemini directly.
- Per-client fixed-window rate limiting, with a budget derived from
  `MAX_PDF_PAGES` so one legitimate multi-page upload cannot exhaust it.
- Request validation on the proxy: accepted MIME types, raw-base64 shape, and an
  8MB decoded size ceiling.
- Model-generated MathML is allowlist-sanitized with DOMPurify before it reaches
  `bypassSecurityTrustHtml`.
- The prompt instructs the model to treat all text in the image as data to
  transcribe, never as instructions to follow.

### Added

- `RemediationProvider` interface with three interchangeable backends: Ollama
  (local, free), any OpenAI-compatible `/v1/chat/completions` endpoint, and
  Gemini.
- `PROVIDER=auto` startup probe that selects the first healthy backend; an
  explicit provider name is honoured even when unhealthy, so a deliberate choice
  fails loudly.
- Outbound request pacing (`Pacer`) that spaces calls under a provider's
  requests-per-minute limit instead of collecting 429s.
- Retry with exponential backoff and jitter that honours a server-requested delay
  and distinguishes a per-day quota from a per-minute one — waiting cannot clear
  the former, so it fails fast with a specific message.
- Memoized health probes behind `/api/health`, since a probe is a billable
  upstream call.
- Multi-page PDF support up to `MAX_PDF_PAGES`, with per-page progress and
  per-page failure isolation; a single bad page no longer discards the rest.
- Content-based file type detection from magic bytes, replacing reliance on
  `File.type`.
- Unicode-to-LaTeX normalization applied to every provider's output, so
  transcriptions containing Unicode math still compile.
- `.tex` export with the original page images, extracted text and remediated
  formulas.
- Unit tests for the pacer, retry classifier, rate limiter, health-probe cache,
  provider parsing and LaTeX normalization; a Playwright UI smoke test; and a
  pdflatex compile check that proves the exported document builds.

### Changed

- The server serves the built frontend, so production runs as a single origin.

## [0.1.0] — 2025-12-13

Initial release.

### Added

- Upload a PDF or image, extract the page text and every formula on it, and get a
  screen-reader description, LaTeX and MathML for each.
- Angular frontend with pdf.js page rendering and a `.tex` export.
- Gemini-backed extraction. **The API key was held in the browser; superseded by
  0.2.0.**

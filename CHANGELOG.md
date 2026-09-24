# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Planned work and known issues live in [ROADMAP.md](ROADMAP.md); this file records
only what has shipped.

## [Unreleased]

### Added

- ClearSpeak and MathSpeak renderings generated from MathML by the Speech Rule
  Engine; the description is no longer written by the model. See
  [ADR 0001](docs/adr/0001-deterministic-speech.md).
- Single-file HTML export carrying inline MathML, the spoken description and the
  page images as data URIs. Opens offline in any browser with no toolchain, which
  `.tex` never could.
- A formula whose LaTeX will not convert is flagged `needsReview` and shown as
  such, instead of having a conversion error narrated to the reader.
- Benchmark harness under `eval/`: dataset schema and loader, a canonical-form
  comparison that treats `\frac`/`\dfrac`, `x^2`/`x^{2}` and `(`/`\left(` as
  equal, per-category reporting, and `npm run eval`. The labelled dataset itself
  is still to be built.
- `docs/institutional-workflow.md`, recording the constraints a campus
  disability resources office imposes and the questions still open.

### Changed

- The model returns a transcription and LaTeX only. MathML is derived from the
  LaTeX with temml rather than requested separately, so the two can no longer
  disagree, and the prompt and response schema shrink accordingly.

## [0.2.0] - 2026-09-07

Moved every model call off the client. The previous release shipped the Gemini
key to the browser.

### Security

- The API key is read only by the backend and is never bundled into the
  frontend. The browser posts page images to `POST /api/remediate` instead of
  calling Gemini directly.
- Per-IP fixed-window rate limiting, with a budget derived from `MAX_PDF_PAGES`
  so one legitimate multi-page upload cannot exhaust it. Client identity is taken
  from the socket address; see ROADMAP.md for the reverse-proxy caveat.
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
- Memoized health probes for the hosted providers behind `/api/health`, since a
  probe there is a billable upstream call.
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

## [0.1.0] - 2025-12-13

Initial release.

### Added

- Upload a PDF or image, extract the page text and every formula on it, and get a
  screen-reader description, LaTeX and MathML for each.
- Angular frontend with pdf.js page rendering and a `.tex` export.
- Gemini-backed extraction. **The API key was held in the browser; superseded by
  0.2.0.**

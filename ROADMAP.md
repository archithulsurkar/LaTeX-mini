# Roadmap

Planned work and known issues. Shipped changes are in [CHANGELOG.md](CHANGELOG.md).

Nothing here has landed. Entries move to the changelog, in past tense, in the
release that carries them.

## Known issues

From a full-repository review. Two hardening items are tracked privately and
will be described here once they ship.

- **Request timeout does not cover retries.** `server.requestTimeout` is derived
  from a single attempt (`provider.timeoutMs + 30s`) while `withRetry` makes up
  to three, each with its own full `AbortSignal.timeout`. The socket can be torn
  down mid-retry, so the client sees a dropped connection instead of the error
  JSON it handles. (`server/index.ts`)
- **`UpstreamError` is treated as retryable.** `isRetryable` matches any object
  carrying a `.status`, and `UpstreamError` carries one, so a missing `API_KEY`
  and a request timeout thrown inside `withRetry` are retried three times.
  (`server/retry.ts`)
- **Health probes are not deduplicated in flight.** `CheckCache` stores only
  settled results, so concurrent `/api/health` requests each reach the upstream
  provider — the amplification the cache exists to prevent.
  (`server/provider.ts`)
- **Unmapped Unicode reaches the `.tex`.** `unicodeToTextLatex` covers only its
  `SYMBOLS` table; characters outside it (`∈ ⊂ ∀ ⇒ ′ … — “ ”`) survive into the
  export and abort `pdflatex` under `inputenc`.
  (`src/shared/latex-normalize.ts`)
- **No client-side image size guard.** A dense page rendered at
  `PDF_RENDER_SCALE` 2.0 can exceed the server's 8MB ceiling; the page is then
  reported only as "could not be analyzed". (`src/app.component.ts`)
- **Stale page images after a failed run.** `uploadedImages` is not cleared on
  the failure path, so a later partial success exports figures from a discarded
  run. (`src/app.component.ts`)
- **Compile harness misreports failures.** It splits the pdflatex log on
  `os.EOL`, but pdflatex writes `\n` even on Windows, so every failure prints
  "unknown error". (`e2e/compile.ts`)
- **Export builder is duplicated.** `e2e/compile.ts` reimplements
  `exportToLatex` and has drifted from it, so the compile proof covers a document
  the app never emits. (`src/latex.ts`, `e2e/compile.ts`)
- **Base64 length is not validated.** A payload whose length is not a multiple of
  four makes `decodedByteLength` return a fractional size. (`server/index.ts`)
- **Rate-limit headroom is computed and discarded.** `remaining` is never sent as
  `X-RateLimit-Remaining`. (`server/index.ts`)
- **OpenAI temperature fallback burns a retry.** It throws a synthetic 503 rather
  than retrying inline, consuming one of three attempts plus a backoff sleep.
  (`server/openai.ts`)
- **`.tex` blob uses an unregistered media type** (`text/latex` rather than
  `application/x-tex`). (`src/app.component.ts`)

## 0.3.0 — Correctness and trust

Close the gap between "the model answered" and "the answer is right and usable".

- **HTML export with embedded MathML.** The tool is an accessibility remediator
  that currently emits only `.tex`, a format no screen reader consumes. HTML plus
  the MathML already generated and sanitized is directly consumable by NVDA, JAWS
  and VoiceOver. No new dependencies.
- **Inline formula placement.** `RemediationResult` keeps `originalText` and
  `formulas` disjoint, so the export prints all prose and then all formulas,
  destroying the reading order of the page. Have the model emit `[FORMULA_n]`
  placeholders inside `originalText` and substitute display math at each marker.
- **Per-formula editing with live preview.** Vision models misread subscripts and
  there is no way to correct one; results render read-only. A remediation tool
  without a correction step is a demo, not a workflow.
- **Client-side LaTeX validation and review flags.** Parse each formula with
  KaTeX in the browser and badge the failures, plus any formula `normalizeLatex`
  had to rewrite. Today a bad formula surfaces only after the user downloads the
  `.tex` and runs pdflatex.
- **Content-addressed result cache.** Keyed on the SHA-256 of the image payload
  and checked before `provider.remediateImage`; re-uploading the same PDF
  currently re-spends the entire free-tier quota.
- **Derive MathML from the LaTeX** (temml or MathJax) instead of asking the model
  for both representations independently, which lets them disagree with nothing
  to catch it.

## 0.4.0 — Measurement

The repository cannot currently produce a single number about its own quality.

- Labelled benchmark set of 100–150 formulas spanning clean typeset, dense
  multi-column, handwritten and chemical notation.
- Math-aware accuracy metric: normalize both sides to MathML and compare trees,
  rather than diffing LaTeX strings.
- CI matrix running the benchmark across every backend behind
  `RemediationProvider`, with results published in the README.
- Load test demonstrating the pacer and retry classifier under burst traffic,
  quantifying the 429s avoided.

## 0.5.0 — Local formula detection

- Local layout/formula detection (Surya or PP-DocLayout via `onnxruntime-node`)
  over the canvas pdf.js already renders, sending cropped regions instead of
  whole pages. Cuts vision tokens, improves accuracy on dense pages, and yields
  bounding boxes.
- Hover-to-highlight linking each result to its region on the source page.

## 0.6.0 — Output verification

- Visual round-trip verification: re-render the returned LaTeX (MathJax → SVG →
  raster) and compare it against the cropped source region with SSIM, producing a
  per-formula confidence score grounded in pixels rather than in the model's own
  report.

## 0.7.0 — Accessibility conformance

- EPUB3 export with embedded MathML, validated with DAISY Ace in CI. (Tagged
  PDF/UA from LaTeX remains too unreliable to promise.)
- axe-core audit of the application's own interface in CI.

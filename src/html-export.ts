/**
 * Builds the remediated document as one self-contained HTML file.
 *
 * This is the format the tool exists to produce. A `.tex` export has to be
 * compiled before anyone can read it, and the result is a PDF that is not
 * accessible unless it is also tagged — so the artefact a student actually
 * needs was two toolchain steps away, both requiring software they do not have.
 *
 * HTML with inline MathML needs none of that. It opens in any browser, offline,
 * and screen readers read the mathematics directly. Everything travels in one
 * file: markup, styles, page images as data URIs.
 */
import type { Formula } from './shared/remediation.types.js';
import { sanitizeMathml } from './mathml.js';

export interface HtmlExportInput {
  originalText: string;
  formulas: Formula[];
  /** Page images as `data:` URLs, in document order. */
  pageImages: string[];
  title?: string;
  generatedAt?: Date;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Keeps blank-line-separated transcription as paragraphs rather than one wall of text. */
function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/**
 * The styles are inlined and deliberately plain: this file may be opened years
 * from now, on unknown software, by someone who needs it to work rather than to
 * look designed. High contrast, generous spacing, no web fonts.
 */
const STYLES = `
  :root { color-scheme: light dark; --fg: #111; --bg: #fff; --muted: #555; --line: #d0d0d0; --panel: #f6f6f6; --flag: #8a5a00; }
  @media (prefers-color-scheme: dark) {
    :root { --fg: #e8e8e8; --bg: #16181d; --muted: #a8adb8; --line: #333842; --panel: #1e2128; --flag: #e0b050; }
  }
  * { box-sizing: border-box; }
  body { margin: 0 auto; padding: 2rem 1rem; max-width: 46rem; background: var(--bg); color: var(--fg);
         font: 1rem/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.25rem; margin: 2.5rem 0 .75rem; padding-bottom: .3rem; border-bottom: 1px solid var(--line); }
  h3 { font-size: 1.05rem; margin: 1.75rem 0 .5rem; }
  .meta { color: var(--muted); font-size: .875rem; margin: 0 0 1rem; }
  .formula { border: 1px solid var(--line); border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0; background: var(--panel); }
  .label { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin: 1rem 0 .25rem; }
  .label:first-child { margin-top: 0; }
  .rendered { font-size: 1.3rem; overflow-x: auto; }
  .braille { font-size: 1.4rem; line-height: 1.4; word-break: break-all; }
  code, pre { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: .9rem; }
  pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
  .flag { color: var(--flag); font-weight: 600; }
  figure { margin: 1.5rem 0; }
  figure img { max-width: 100%; height: auto; border: 1px solid var(--line); }
  figcaption { color: var(--muted); font-size: .875rem; margin-top: .4rem; }
  @media print { body { max-width: none; } .formula { break-inside: avoid; } }
`;

function renderFormula(formula: Formula, index: number): string {
  const heading = `Formula ${index + 1}`;
  const parts: string[] = [
    `<h3>${heading}${formula.needsReview ? ' <span class="flag">— needs review</span>' : ''}</h3>`,
  ];

  if (formula.needsReview) {
    parts.push(
      `<p class="flag">This formula could not be converted, so no spoken or braille form was produced. ` +
        `The transcription below is unverified.</p>`,
    );
  }

  if (formula.mathml) {
    // Labelled with the ClearSpeak text: MathML support in screen readers is
    // uneven, and the label is what a reader falls back to.
    parts.push(
      '<p class="label">Rendered</p>',
      `<div class="rendered" role="math" aria-label="${escapeHtml(formula.description)}">` +
        `${sanitizeMathml(formula.mathml)}</div>`,
    );
  }

  if (formula.description) {
    parts.push('<p class="label">Spoken description (ClearSpeak)</p>', `<p>${escapeHtml(formula.description)}</p>`);
  }

  if (formula.mathspeak && formula.mathspeak !== formula.description) {
    parts.push('<p class="label">Spoken description (MathSpeak)</p>', `<p>${escapeHtml(formula.mathspeak)}</p>`);
  }

  if (formula.braille) {
    parts.push('<p class="label">Braille (Nemeth)</p>', `<p class="braille">${escapeHtml(formula.braille)}</p>`);
  }

  parts.push('<p class="label">LaTeX</p>', `<pre><code>${escapeHtml(formula.latex)}</code></pre>`);

  return `<section class="formula" aria-label="${escapeHtml(heading)}">\n${parts.join('\n')}\n</section>`;
}

/** Renders the whole document as one HTML string with no external references. */
export function buildStandaloneHtml(input: HtmlExportInput): string {
  const title = input.title ?? 'Remediated Document';
  const generatedAt = input.generatedAt ?? new Date();
  const flagged = input.formulas.filter((formula) => formula.needsReview).length;

  const sections: string[] = [];

  if (input.originalText) {
    sections.push(`<h2>Extracted text</h2>\n${paragraphs(input.originalText)}`);
  }

  if (input.formulas.length) {
    sections.push(
      `<h2>Formulas</h2>\n${input.formulas.map((formula, index) => renderFormula(formula, index)).join('\n')}`,
    );
  }

  if (input.pageImages.length) {
    const figures = input.pageImages
      .map(
        (dataUrl, index) =>
          `<figure>\n<img src="${dataUrl}" alt="Page ${index + 1} of the original document">\n` +
          `<figcaption>Original page ${index + 1}</figcaption>\n</figure>`,
      )
      .join('\n');
    sections.push(`<h2>Original pages</h2>\n${figures}`);
  }

  const summary = [
    `${input.formulas.length} formula${input.formulas.length === 1 ? '' : 's'}`,
    `${input.pageImages.length} page${input.pageImages.length === 1 ? '' : 's'}`,
    flagged ? `${flagged} needing review` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p class="meta">${escapeHtml(summary)} · generated ${escapeHtml(generatedAt.toISOString().slice(0, 10))} ·
speech and braille generated from MathML by rule, not written by a language model</p>
${sections.join('\n\n')}
</body>
</html>
`;
}


import { ChangeDetectionStrategy, Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { Formula, RemediationService, RemediationResult } from './services/remediation.service';
import { escapeLatex, pageImageFilename, toDisplayMath } from './latex';
import { sanitizeMathml } from './mathml';
import { MAX_PDF_PAGES } from './shared/remediation.types';

// Served from the app origin (see the `assets` entry in angular.json) so the
// worker build always matches the bundled library version.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface FormulaView {
  formula: Formula;
  /**
   * MathML is model output derived from an uploaded file, so it is untrusted:
   * text embedded in the document can steer the model into emitting markup.
   * Allowlist it before handing it to bypassSecurityTrustHtml.
   */
  safeMathml: SafeHtml;
}

/** A rendered page ready to send to the API. */
interface PageImage {
  /** Full `data:` URL, for display. */
  dataUrl: string;
  /** Bare base64 payload, for the API. */
  base64: string;
  mimeType: string;
}

/** Rendering scale for PDF pages. Higher reads small subscripts more reliably. */
const PDF_RENDER_SCALE = 2.0;

const ACCEPTED_UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] as const;
type UploadType = (typeof ACCEPTED_UPLOAD_TYPES)[number];

/**
 * `File.type` is guessed from the extension and is empty for many files, so
 * detect from content instead. Signatures are checked against the first bytes.
 */
const FILE_SIGNATURES: ReadonlyArray<{ type: UploadType; bytes: number[]; offset: number }> = [
  { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }, // %PDF
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { type: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" after RIFF size
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private remediationService = inject(RemediationService);
  private sanitizer = inject(DomSanitizer);

  status: WritableSignal<Status> = signal('idle');
  remediationResult: WritableSignal<RemediationResult> = signal({ formulas: [], originalText: '' });
  errorMessage: WritableSignal<string> = signal('');
  /** One entry per processed page, in document order. */
  uploadedImages: WritableSignal<string[]> = signal([]);
  /** Non-fatal warning shown alongside a successful result, e.g. a truncated PDF. */
  notice: WritableSignal<string> = signal('');
  /** Page-level progress while a multi-page document is analyzed. */
  progress: WritableSignal<{ current: number; total: number } | null> = signal(null);
  /** Transient feedback for the copy buttons, keyed by the copied text. */
  copyFeedback: WritableSignal<string> = signal('');
  private copyFeedbackTimer?: ReturnType<typeof setTimeout>;

  /**
   * Sanitized once per result rather than from the template binding, which would
   * re-sanitize and re-allocate on every change detection pass.
   */
  readonly formulaViews = computed<FormulaView[]>(() =>
    this.remediationResult().formulas.map((formula) => ({
      formula,
      safeMathml: this.sanitizer.bypassSecurityTrustHtml(sanitizeMathml(formula.mathml)),
    })),
  );

  async handleFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    // Re-uploading the same file otherwise fires no change event.
    input.value = '';

    this.notice.set('');
    this.status.set('loading');
    this.progress.set(null);

    try {
      const detectedType = await this.detectFileType(file);
      if (!detectedType) {
        this.errorMessage.set('Invalid file type. Please upload a PDF, PNG, JPG, or WEBP file.');
        this.status.set('error');
        return;
      }

      const pages =
        detectedType === 'application/pdf'
          ? await this.pdfToImages(file)
          : [await this.fileToPageImage(file, detectedType)];

      this.uploadedImages.set(pages.map((page) => page.dataUrl));

      const merged: RemediationResult = { formulas: [], originalText: '' };
      const failedPages: number[] = [];

      for (const [index, page] of pages.entries()) {
        this.progress.set({ current: index + 1, total: pages.length });
        try {
          const result = await this.remediationService.remediateImage(page.base64, page.mimeType);
          merged.formulas.push(...result.formulas);
          if (result.originalText) {
            merged.originalText += (merged.originalText ? '\n\n' : '') + result.originalText;
          }
        } catch (error) {
          // One bad page should not discard the pages that did work.
          console.error(`Page ${index + 1} failed:`, error);
          failedPages.push(index + 1);
          if (failedPages.length === pages.length) {
            throw error;
          }
        }
      }

      if (failedPages.length) {
        this.appendNotice(`Page(s) ${failedPages.join(', ')} could not be analyzed and were skipped.`);
      }

      if (merged.formulas.length > 0 || merged.originalText) {
        this.remediationResult.set(merged);
        this.status.set('success');
      } else {
        this.errorMessage.set('No formulas or text were found in the file. Please try a different one.');
        this.status.set('error');
      }
    } catch (error) {
      console.error(error);
      // Server errors already carry a user-facing message; don't bury it in a prefix.
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to process file. An unknown error occurred.',
      );
      this.status.set('error');
    }
  }

  reset(): void {
    this.status.set('idle');
    this.remediationResult.set({ formulas: [], originalText: '' });
    this.errorMessage.set('');
    this.uploadedImages.set([]);
    this.notice.set('');
    this.progress.set(null);
    this.copyFeedback.set('');
  }

  async copyToClipboard(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback(`${label} copied to clipboard.`);
    } catch (error) {
      // Denied permission or an insecure origin — the user needs to know it failed.
      console.error('Failed to copy text: ', error);
      this.showCopyFeedback(`Could not copy ${label.toLowerCase()}. Select the text and copy manually.`);
    }
  }

  private showCopyFeedback(message: string): void {
    clearTimeout(this.copyFeedbackTimer);
    this.copyFeedback.set(message);
    this.copyFeedbackTimer = setTimeout(() => this.copyFeedback.set(''), 4000);
  }

  private appendNotice(message: string): void {
    this.notice.update((current) => (current ? `${current} ${message}` : message));
  }

  exportToLatex(): void {
    const result = this.remediationResult();
    if (!result.formulas.length && !result.originalText) {
      return;
    }

    const header = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\title{Remediated Document}
\\author{Generated by Formula Accessibility Remediator}
\\date{\\today}

\\begin{document}
\\maketitle
`;

    // One figure per processed page. Filenames match what "Download page images" saves.
    const pageCount = this.uploadedImages().length;
    const imageSection = pageCount
      ? `\\section*{Original Page Images}
${Array.from({ length: pageCount }, (_, index) => {
  const name = pageImageFilename(index);
  return `\\begin{figure}[h!]
\\centering
\\IfFileExists{${name}}{\\includegraphics[width=\\textwidth,height=\\textheight,keepaspectratio]{${name}}}{\\fbox{Missing ${name}}}
\\caption{Original document page ${index + 1}.}
\\end{figure}`;
}).join('\n')}
\\clearpage
`
      : '';

    const textSection = result.originalText 
      ? `\\section*{Extracted Text Content}
${escapeLatex(result.originalText)}
\\clearpage
`
      : '';

    const formulaSection = result.formulas.length > 0
      ? `\\section*{Remediated Formulas}
${result.formulas.map((formula, index) => {
        const sanitizedDescription = escapeLatex(formula.description);
        return `\\subsection*{Formula ${index + 1}}
\\subsubsection*{Description}
${sanitizedDescription}

\\subsubsection*{LaTeX}
${toDisplayMath(formula.latex)}
\\hrulefill`;
      }).join('\n\n')}
` 
      : '';

    const footer = `
\\end{document}
`;

    const latexContent = header + imageSection + textSection + formulaSection + footer;
    const blob = new Blob([latexContent], { type: 'text/latex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remediated-document.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Saves the rendered page images under the names the generated .tex expects. */
  downloadPageImages(): void {
    this.uploadedImages().forEach((dataUrl, index) => {
      AppComponent.triggerDownload(dataUrl, pageImageFilename(index));
    });
  }

  private static triggerDownload(href: string, filename: string): void {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  /**
   * Identifies the upload from its leading bytes. `File.type` is derived from the
   * extension, so it is empty for extensionless files and wrong for renamed ones.
   */
  private async detectFileType(file: File): Promise<UploadType | null> {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const match = FILE_SIGNATURES.find(({ bytes, offset }) =>
      bytes.every((byte, i) => header[offset + i] === byte),
    );
    return match?.type ?? null;
  }

  private async fileToPageImage(file: File, mimeType: UploadType): Promise<PageImage> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read the file.'));
      reader.readAsDataURL(file);
    });
    return { dataUrl, base64: dataUrl.split(',')[1], mimeType };
  }

  /**
   * Renders every page of the PDF, up to MAX_PDF_PAGES. The previous version
   * silently analyzed only page 1 and discarded the rest.
   */
  private async pdfToImages(file: File): Promise<PageImage[]> {
    // The loading task owns the worker; only it can tear the document down.
    // PDFDocumentProxy itself has no destroy() in pdf.js v6.
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });

    let pdf: pdfjsLib.PDFDocumentProxy;
    try {
      pdf = await loadingTask.promise;
    } catch (error) {
      await loadingTask.destroy();
      throw new Error('Could not read the PDF. It might be corrupted or password protected.', { cause: error });
    }

    try {
      const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
      if (pdf.numPages > MAX_PDF_PAGES) {
        this.appendNotice(
          `This PDF has ${pdf.numPages} pages; only the first ${MAX_PDF_PAGES} were analyzed.`,
        );
      }

      const pages: PageImage[] = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
        pages.push(await this.renderPdfPage(pdf, pageNumber));
      }
      return pages;
    } finally {
      await loadingTask.destroy();
    }
  }

  private async renderPdfPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
  ): Promise<PageImage> {
    const page = await pdf.getPage(pageNumber);
    try {
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      if (!canvas.getContext('2d')) {
        throw new Error('Could not create a canvas context to render the PDF.');
      }

      await page.render({ canvas, viewport }).promise;

      // PNG keeps formula strokes crisp; JPEG artifacts confuse small subscripts.
      const dataUrl = canvas.toDataURL('image/png');
      return { dataUrl, base64: dataUrl.split(',')[1], mimeType: 'image/png' };
    } finally {
      page.cleanup();
    }
  }
}

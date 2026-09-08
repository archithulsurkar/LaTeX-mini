import { Injectable } from '@angular/core';
import type { ApiErrorBody, RemediateRequest, RemediationResult } from '../shared/remediation.types.js';

export type { Formula, RemediationResult } from '../shared/remediation.types.js';

/**
 * Calls the backend proxy. The Gemini key lives on the server only — nothing
 * here should ever hold or forward it.
 */
@Injectable({ providedIn: 'root' })
export class RemediationService {
  async remediateImage(base64Image: string, mimeType: string): Promise<RemediationResult> {
    const body: RemediateRequest = { image: base64Image, mimeType };

    let response: Response;
    try {
      response = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error('Could not reach the remediation server. Is it running?', { cause: error });
    }

    if (!response.ok) {
      const detail = await response
        .json()
        .then((parsed: ApiErrorBody) => parsed?.error)
        .catch(() => undefined);
      throw new Error(detail ?? `Remediation failed (HTTP ${response.status}).`);
    }

    return (await response.json()) as RemediationResult;
  }
}

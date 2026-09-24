/**
 * Minimal ambient types for speech-rule-engine, which ships no declarations.
 *
 * Only the surface this project uses is declared. Note there is no `toBraille`
 * in v5: braille comes from `toSpeech` after the engine is switched to the
 * braille modality, which is why {@link SreConfig.modality} is part of every
 * call site rather than an afterthought.
 */
declare module 'speech-rule-engine' {
  export interface SreConfig {
    /** `en` for speech; `nemeth` (or `euro`) for braille. */
    locale?: string;
    /** Rule set: `clearspeak`, `mathspeak`, or `default` for braille. */
    domain?: string;
    /** Verbosity within the rule set, e.g. `default`, `brief`, `sbrief`. */
    style?: string;
    modality?: 'speech' | 'braille' | 'prefix' | 'summary';
    markup?: string;
  }

  export function setupEngine(config: SreConfig): Promise<void>;
  export function engineReady(): Promise<void>;
  export function toSpeech(mathml: string): string;
  export function toEnriched(mathml: string): string;
  export function version(): string;

  const sre: {
    setupEngine: typeof setupEngine;
    engineReady: typeof engineReady;
    toSpeech: typeof toSpeech;
    toEnriched: typeof toEnriched;
    version: typeof version;
  };
  export default sre;
}

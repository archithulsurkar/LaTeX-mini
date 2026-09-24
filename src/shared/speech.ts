/**
 * Deterministic accessible renderings of a formula.
 *
 * The screen-reader description is the thing a blind reader actually receives,
 * so it is the last part of this pipeline that should be left to a language
 * model: prose invented per request is unverifiable, inconsistent between runs,
 * and conforms to no standard. Turning MathML into spoken maths is instead a
 * solved, rule-based problem with published rule sets — ClearSpeak and
 * MathSpeak — and the same engine emits Nemeth braille.
 *
 * So the model transcribes and nothing else; everything a reader consumes is
 * generated here, from the MathML, by rules that can be unit tested.
 */
import sre from 'speech-rule-engine';

export interface AccessibleRenderings {
  /** ClearSpeak: reads the way a person would say it aloud. The default. */
  clearspeak: string;
  /** MathSpeak: explicit structure markers, preferred by some readers. */
  mathspeak: string;
  /** Nemeth braille, as Unicode braille patterns. */
  braille: string;
}

/**
 * SRE's engine is a process-wide singleton reconfigured by `setupEngine`, so
 * two concurrent callers wanting different rule sets would race and read each
 * other's configuration. Every access is therefore funnelled through one chain.
 */
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  // Keep the chain alive regardless of this task's outcome.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function render(mathml: string, config: Parameters<typeof sre.setupEngine>[0]): Promise<string> {
  await sre.setupEngine(config);
  await sre.engineReady();
  return sre.toSpeech(mathml).trim();
}

/**
 * Renders one MathML string as speech and braille.
 *
 * Callers pass MathML derived from the model's LaTeX rather than MathML the
 * model wrote, so the speech, the braille and the rendered formula cannot
 * disagree with one another.
 */
export async function renderAccessible(mathml: string): Promise<AccessibleRenderings> {
  return serialize(async () => ({
    clearspeak: await render(mathml, {
      locale: 'en',
      domain: 'clearspeak',
      style: 'default',
      modality: 'speech',
    }),
    mathspeak: await render(mathml, {
      locale: 'en',
      domain: 'mathspeak',
      style: 'default',
      modality: 'speech',
    }),
    braille: await render(mathml, {
      locale: 'nemeth',
      domain: 'default',
      style: 'default',
      modality: 'braille',
    }),
  }));
}

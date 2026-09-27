# Demo script

A walk through every feature worth showing, in an order that tells the story.
About ten minutes. Everything in parts 1–5 runs on the hosted demo with nothing
installed:

**https://archithulsurkar.github.io/LaTeX-mini/**

Part 6 needs the desktop app (or `npm run dev`) and a model backend.

## The one-sentence pitch

A vision model reads the page and writes LaTeX. Everything a reader actually
receives (MathML and the spoken description) is then derived from that LaTeX
by fixed rules, so the same formula always reads the same way and the output
can be tested.

## 1. Paste LaTeX, hear it read (1 min)

1. Click **or try an example**. Four formulas appear: the quadratic formula, E = mc², an integral and a chemical equation.
2. Point out the layout: the rendered formula with a textbook equation number, then **Read aloud as "…"**, then the LaTeX.
3. Click **Listen** on the quadratic formula. It speaks *"x equals the fraction with numerator negative b plus or minus the square root of…"*
4. Say: this description is ClearSpeak, the rule set screen-reader users already know. It was produced by the Speech Rule Engine (the library MathJax uses), not written by a language model.

## 2. It runs with no network (30 s)

1. Open DevTools → Network → **Offline**.
2. Click **Start over**, then **or try an example** again. It still works.
3. Say: transcription is the only step that needs a model, and pasting skips it.

## 3. Failure is visible, not narrated (30 s)

1. Paste these three lines and click **Remediate**:
   ```
   \frac{a}{b}
   \sqrt{x^2+1}
   \frac{1}{
   ```
2. The third is highlighted **Needs a second look**: no MathML, and no invented speech.
3. Say: a model-written description would have happily described a broken formula. A rule engine refuses.

## 4. Reading a page: the sample (2 min)

1. Click **Start over**, then **or try a sample page** under *Or upload a page*.
2. The results show three formulas, and the original page appears below them.
3. Read the note at the top: the transcription was recorded from `qwen2.5vl:7b` (best of 3 runs, because its output varies), and the MathML and speech were made just now in the browser.
4. Point at the page: it has **four** formulas, and the model missed the photosynthesis equation.
5. Say: this is why the output is built for review, and why the benchmark harness exists (`npm run eval`). Model output varies from run to run; everything after it does not.

## 5. Export and accounts (3 min)

1. Click **Download accessible HTML**. Open the file: plain black-on-white, the page text with its original line breaks, each formula as MathML with its spoken form. It works offline, in any browser, as a single file.
2. Optional: open that file with **NVDA** (free) or **Narrator** (Win+Ctrl+Enter) and arrow onto a formula. It is read as maths.
3. Click **Sign in**, enter your email and open the link from your inbox. You're back, signed in.
4. Run the example or the sample page again. The results line says **Saved to your history**.
5. Open **History**. Reopen an item: MathML and speech are rebuilt from the saved LaTeX, since only LaTeX and page text are stored and page images never leave the device. Delete one (press twice to confirm).
6. Say: row-level security means each account can only ever see its own rows. It was tested against the live database with two users.

## 6. The desktop app with a real model (3 min)

Needs `formula-remediator.exe` (or `npm run dev`) and a backend: Ollama locally, or an API key.

1. Start `formula-remediator.exe` and open http://localhost:8787.
2. Open **Model backend**. Pick a provider, for example Ollama with `qwen2.5vl:7b`, or Groq/OpenRouter with a key, and click **Use this backend**. Try a wrong key first: it's refused and the working backend keeps running.
3. Click **Choose a file…** and upload a worksheet PDF. Pages are read one by one ("Reading page 2 of 3…"), and a page that fails is skipped without losing the others.
4. Download the HTML, the `.tex` and the page images.

## Questions people ask

- **Why not let the model write the description?** It changes between runs, follows no standard and can't be tested. See `docs/adr/0001-deterministic-speech.md`.
- **Is my document uploaded anywhere?** Pasted LaTeX stays in the browser unless you're signed in (then it's saved to your own history). Uploaded pages go only to the model backend you chose. Page images are never saved to history.
- **How accurate is it?** Measured with `npm run eval` against a labelled set; see `eval/README.md`. The labelled dataset is the next milestone in `ROADMAP.md`.

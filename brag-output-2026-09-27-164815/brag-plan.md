# Brag Plan: Formula Remediator

## What is this app?

It turns the maths on a page (pasted LaTeX, or a PDF or photo of a worksheet) into MathML plus a spoken description a screen reader can say. The impressive part: the model only transcribes, and every word a reader hears comes from fixed rules, so the same formula always sounds the same.

## The angle

**Maths that can finally be heard properly.** Raw LaTeX read aloud is gibberish ("backslash frac, left brace…"). This tool makes it say "x equals the fraction with numerator negative b…", in the ClearSpeak style screen-reader users already know.

The video plays that contrast straight: first the noise, then the sentence, then the tool doing it to a real worksheet. It's specific to this project because the product's output *is* language, so the words on screen are the product.

## Hook (first 2-3 seconds)

On plain paper, a small label: **"Raw LaTeX, read aloud:"**. Then the quadratic formula's LaTeX types out in monospace, and beneath it the literal reading appears in grey: *"backslash frac, left brace, minus b, backslash p m…"*. The viewer feels the problem before any product appears.

## Key moments (the middle)

- The LaTeX line collapses into the typeset formula, centred, with a textbook equation number **(1)** at the right margin (the app's signature detail).
- **"Read aloud as"** and then the ClearSpeak sentence types in: *"x equals the fraction with numerator negative b plus or minus the square root of b squared minus 4 a c and denominator 2 a"*. A cursor presses **Listen**.
- The real sample worksheet (*Worksheet 4: Motion and energy*) slides in. "Reading page 1 of 1…", then three formula rows stack one by one, each numbered (1) (2) (3), each with its spoken line.

## Outro / punchline

A cursor presses **Download accessible HTML**. Cut to the wordmark on paper:
**Formula Remediator**, then the tagline *readable maths for everyone*, then the URL `archithulsurkar.github.io/LaTeX-mini`. Hold on quiet paper.

## User flow worth showing

Entry → key action → result, from the real app (`src/app.component.html`, `src/demo-sample.ts`):

1. **Entry:** click "or try a sample page" under *Or upload a page*.
2. **Key action:** the worksheet image appears; "Reading page 1 of 1…".
3. **Result:** the Results list: three formulas with textbook numbers, "Read aloud as …", Listen / Copy words, then **Download accessible HTML**.

## Tone

- Preset: `polished`
- Creative direction: a quiet accessibility film; the maths learns to speak
- Interpretation: few scenes, generous holds, nothing flashy. Motion is typing, collapsing and stacking, like writing on paper. The only drama is the moment gibberish becomes a sentence.

## Format: landscape — 1920x1080
## Duration: 22s

## Visual identity (from the project)

Taken from `src/styles.css`, the worksheet redesign:

- Background: `#fbfbf9` (paper)
- Accent: `#0f5c45` (pen green, for buttons and links)
- Text: `#1c1c1a` (ink); secondary text `#57574f`
- Highlighter: `#fbe98a` (the "needs a second look" mark); rules `#dcdcd4`
- Display font: Atkinson Hyperlegible Next, bold (bundled via @fontsource)
- Body font: Atkinson Hyperlegible Next, regular; code in a system monospace (Cascadia Code / Consolas)
- Strongest visual element: a formula centred on paper with its textbook equation number **(1)** at the right margin, and "Read aloud as “…”" beneath it. No cards, no shadows, thin rules between items.

## Share copy (draft)

Screen readers read raw LaTeX as "backslash frac, left brace…", so I built a tool that makes maths actually speak: the model only transcribes, and the words come from fixed rules, so the same formula always sounds the same. Try it in your browser: https://archithulsurkar.github.io/LaTeX-mini/

## Audio direction

- Role: warm bed with sparse, motion-matched accents
- Music: `happy-beats-business-moves-vol-9-by-ende-dot-app.mp3`, low
- Music treatment: starts at 0.0s under the hook at low volume (the typing must stay audible), fade in over ~0.5s, sits in the background, fades out over the last ~1.5s under the held wordmark
- Music cue guidance: preset read from `assets/music/cues/…vol-9….music-cues.md`, 114.84 BPM (beat ≈ 0.52s)
  - Strong cue **6.34s**: the formula collapse lands (Scene 2 reveal)
  - Strong cue **10.54s**: the worksheet page lands (Scene 3)
  - Beat **17.91s**: the wordmark lands (Scene 4)
  - Sequential rows in Scene 3: snap to **every other beat**, 12.12s, 13.18s, 14.22s (about 1.05s apart), then the full set holds; never faster, since each row carries text
- Audio-reactive treatment: none. Keep the paper calm.
- SFX posture: sparse and motion-matched; professional restraint
- Audio-coupled moments: key ticks while the LaTeX types (Scene 1); soft ticks while the ClearSpeak sentence types (Scene 2); one soft click on **Listen**; a paper-slide swish as the page enters; three quiet ticks as the rows stack; one soft click on **Download accessible HTML**; a single gentle hit on the wordmark
- Restraint rule: no whooshes on text entrances, no risers or booms, and nothing louder than the typing in the first 5 seconds

## Voiceover script

**Removed after review:** the user asked for no voice, so the final cut has music and sound effects only. The script is kept here for reference.

Run with `--voice`: Kokoro via Hyperframes, voice `af_heart`. One line per scene, generated as a separate clip so each scene's length follows its own line. The narration complements what's on screen and never reads it out: the screen shows the LaTeX and the ClearSpeak sentence, and the voice says what they mean.

1. **The noise:** "To a screen reader, maths written in LaTeX sounds like this."
2. **The sentence:** "We turn it into words, by rule, so it sounds the same every time."
3. **A real worksheet:** "Hand it a worksheet: a model copies the maths, and the rules do the talking."
4. **Take it with you:** "One accessible file. Try it free in your browser."

About 46 words at about 2.5 words per second, which leaves room to breathe inside 22 seconds. Scene durations flex to fit the generated audio; the music ducks under the voice (Hyperframes voiceover carve).

## Storyboard

### Scene 1 — The noise — 5.0s (0.0–5.0)

Paper background. Top-left small label in secondary ink: **"Raw LaTeX, read aloud:"** (settles by ~0.6s and holds). Centred, monospace, ink: `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}` types out character by character (~1.2s). Beneath it, in secondary ink, the literal reading fades in and holds for at least 2s: *"backslash frac, left brace, minus b, backslash p m…"*.
Sequential/interaction: yes. The LaTeX line types out character by character, then the reading appears as one line and holds.
Audio intent: intimate, a little uncomfortable; the key ticks are the loudest thing.
Audio-coupled idea: key ticks synced to the typing.
Music: low warm bed, barely there.
Transition mood: clean. The LaTeX line itself becomes Scene 2 (morph, no cut) → Scene 2

### Scene 2 — The sentence — 5.0s (5.0–10.0)

The grey reading fades away. The monospace LaTeX collapses into the typeset formula (MathML look, large, centred), landing on the **6.34s** strong cue, with **(1)** appearing at the right margin. Beneath it: **Read aloud as** (secondary ink), then the ClearSpeak sentence types in: *"x equals the fraction with numerator negative b plus or minus the square root of b squared minus 4 a c and denominator 2 a"*. Hold it fully typed for at least ~2s. A cursor presses the pen-green **Listen** button (with its speaker icon); the button shows its press state.
Product material: the result layout from `src/app.component.html`: formula, equation number, "Read aloud as “…”", Listen / Copy words.
Sequential/interaction: yes. Formula collapse → equation number → sentence types → simulated click on Listen.
Audio intent: relief; the room opens up.
Audio-coupled idea: soft ticks while the sentence types; one soft click on Listen.
Music: bed rises slightly after the collapse.
Transition mood: soft slide up → Scene 3

### Scene 3 — A real worksheet — 6.0s (10.0–16.0)

Left: the real sample page image (`public/sample/worksheet.png`, *Worksheet 4: Motion and energy*) slides in on paper with a thin rule border, landing on **10.54s**. A small line beside it: "Reading page 1 of 1…" with the app's thin pen-green spinner, held about 0.8s. Right: a **Results · 3 formulas from 1 page** header, then three rows stack one by one at **12.12s, 13.18s and 14.22s**, each separated by a thin rule:
1. `h = ut − ½gt²` (1), *"h equals u t minus one half g of t squared"*
2. `E_k = ½mv²` (2), *"E sub k equals one half m v squared"*
3. the quadratic formula (3), its sentence shortened with an ellipsis to fit

The full set holds for about 1.5s after the last row.
Product material: the sample-page flow (`loadSamplePage()` in `src/app.component.ts`) and the real spoken lines produced from `src/demo-sample.ts`.
Sequential/interaction: yes. The page enters, the reading status shows, then three rows arrive one by one (every other beat) and hold as a set.
Audio intent: momentum, competence.
Audio-coupled idea: a paper-slide swish on the page; three quiet ticks on the rows.
Music: bed at its fullest, still background.
Transition mood: clean crossfade → Scene 4

### Scene 4 — Take it with you — 6.0s (16.0–22.0)

A cursor presses **Download accessible HTML** (pen-green button); a small caption appears for about 1s: *"one file · works offline · any screen reader"*. The page clears to empty paper. The wordmark **Formula Remediator** (bold, ink) lands on the **17.91s** beat, the tagline *readable maths for everyone* (italic, secondary ink) follows, then the URL `archithulsurkar.github.io/LaTeX-mini` in pen green. Hold everything on quiet paper to the end.
Sequential/interaction: yes. Simulated click on Download; then wordmark → tagline → URL, each settled for at least 0.8s.
Audio intent: warm, settled, finished.
Audio-coupled idea: one soft click on Download; a single gentle hit on the wordmark.
Music: fades out over the last ~1.5s.
Transition mood: none (end on the hold)

**Music mood for this video:** warm, understated, upbeat
**Audio summary:** A barely-there bed under the typing of raw LaTeX, rising gently when the formula becomes a sentence, full but background through the worksheet flow, and fading out under the held wordmark.

---

Scene durations: 5.0 + 5.0 + 6.0 + 6.0 = **22.0s**.

Every spoken line in the storyboard is real output of the app for that LaTeX (ClearSpeak via the Speech Rule Engine); reuse them verbatim rather than paraphrasing.

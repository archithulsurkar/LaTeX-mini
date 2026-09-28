# Hyperframes Composition Brief: Formula Remediator

## Objective
Create a short launch-style brag video for Formula Remediator, narrated (`/brag --voice`).

## Output
- Composition directory: `brag-output-2026-09-27-164815/composition/`
- Rendered video: `brag-output-2026-09-27-164815/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 23 seconds (flexed from the planned 22s to fit the generated voiceover)

## Source Material
- Project root: the LaTeX-mini repository (this worktree)
- Primary files read: `src/app.component.html`, `src/app.component.ts`, `src/styles.css`, `src/demo-sample.ts`, `public/sample/worksheet.png`, `README.md`, `docs/demo.md`
- Product name: Formula Remediator
- Tagline / strongest claim: "readable maths for everyone"; the model only transcribes, and the words come from fixed rules, so the same formula always sounds the same
- Key UI or visual moment to recreate: the Results list: a formula centred on paper with a textbook equation number, "Read aloud as “…”", and the pen-green Listen button; the sample page flow ("or try a sample page" → "Reading page 1 of 1…" → three numbered results)
- Copy that must appear verbatim:
  - "Raw LaTeX, read aloud:"
  - `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`
  - "Read aloud as"
  - "x equals the fraction with numerator negative b plus or minus the square root of b squared minus 4 a c and denominator 2 a" (real app output)
  - "h equals u t minus one half g of t squared" and "E sub k equals one half m v squared" (real app output for the sample page)
  - "Download accessible HTML", "Formula Remediator", "readable maths for everyone"

## Creative Direction
- Tone preset: polished
- Creative direction: a quiet accessibility film; the maths learns to speak
- Interpretation: four scenes, generous holds, calm paper-and-ink motion (typing, collapsing, stacking). The only drama is gibberish becoming a sentence.
- Angle: raw LaTeX read aloud is noise ("backslash frac, left brace…"). This tool makes it say the ClearSpeak sentence screen-reader users know, then does the same to a real worksheet.
- Hook: "Raw LaTeX, read aloud:" + the quadratic formula's LaTeX typing out + its literal reading in grey
- Outro / punchline: Download accessible HTML → **Formula Remediator** / *readable maths for everyone* / `archithulsurkar.github.io/LaTeX-mini`
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign (use the app's worksheet look, not a new one)

## Visual Identity
- Background: `#fbfbf9` (paper)
- Text: `#1c1c1a` (ink); secondary `#57574f`
- Accent: `#0f5c45` (pen green); highlighter `#fbe98a`; rules `#dcdcd4`
- Display font: Atkinson Hyperlegible Next 700 (local woff2 in `assets/fonts/`)
- Body font: Atkinson Hyperlegible Next 400 / 400 italic (local woff2)
- Visual references from the project: textbook equation numbers at the right margin, thin rules instead of cards, faint ruled-paper lines, the pen-green button

## Storyboard
Use the storyboard in `brag-plan.md` as the creative contract, with timings flexed to the voiceover:

1. The noise — 0.0–5.0s — "Raw LaTeX, read aloud:", the LaTeX types out, the literal reading holds
2. The sentence — 5.0–11.0s — LaTeX collapses to MathML with (1) (beat-locked 6.34s), "Read aloud as" + sentence types in and holds, cursor presses Listen
3. A real worksheet — 11.0–17.5s — worksheet page slides in (beat-locked 11.60s), "Reading page 1 of 1…", three result rows at 13.18 / 14.22 / 15.28s (every other beat), set holds
4. Take it with you — 17.5–23.0s — cursor presses Download accessible HTML, caption, wordmark (beat 19.48s), tagline, URL, hold

## Audio
- Audio role: warm bed with sparse, motion-matched accents, under narration
- Audio arc: quiet bed under the typed hook and first line; rises slightly after the collapse; full but background through the worksheet; fades out under the held wordmark
- Music: `assets/music/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3`, base volume 0.32
- Music treatment: fade in over 0.5s, fade out 21.5–23.0s; voiceover carve on the bed (Hyperframes `carve.mjs`), or a volume duck to ~0.13 under each voice line if carve is unavailable
- Music cue guidance: bundled preset `<skill-dir>/assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json` (114.84 BPM). Strong cue locks: 6.34s (formula collapse), 11.60s (page lands). Beat grid: rows at 13.18 / 14.22 / 15.28s; wordmark at 19.48s.
- Audio-reactive treatment: subtle; music bass energy drives the opacity of the faint ruled-paper lines and a low pen-green wash behind the content. No waveform or equalizer visuals.
- Audio-coupled moments:
  - Scene 1 — LaTeX typing — thinned key ticks
  - Scene 2 — formula collapse — one soft impact; Listen — click
  - Scene 3 — page slide — card-slide; three rows — soft rollovers
  - Scene 4 — Download — click; wordmark — soft bong
- SFX selection guidance: few, warm, low high-frequency risk (from `sfx-analysis.md`)
- Voiceover: Kokoro `af_heart`, four clips `assets/vo-1.wav`…`vo-4.wav` (3.50s, 3.69s, 4.39s, 2.92s) at 0.5s, 5.6s, 11.4s, 18.0s
- Audio files: all copied into `composition/assets/`

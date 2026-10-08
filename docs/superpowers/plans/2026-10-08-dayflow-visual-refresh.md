# Dayflow Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Dayflow’s neuro/editorial visual cues with a warm editorial interface, rounded tactile surfaces, and a dusty-rose pastel palette without changing behavior.

**Architecture:** Keep the existing Astro page and browser-only script intact. Change hero copy and privacy placement in `src/pages/index.astro`; centralize the new visual system in `src/styles/global.css` using light/dark variables, shared radius tokens, rounded surfaces, and accessible focus states. Preserve all existing DOM ids, data attributes, event listeners, and export structure.

**Tech Stack:** Astro 5, TypeScript, plain CSS, Vitest, Python smoke checks, local Chrome preview.

---

### Task 1: Simplify hero copy and privacy placement

**Files:** `src/pages/index.astro:21-36`

- [ ] Remove the `всё остаётся в браузере` eyebrow and the entire `.intro-note` arrow callout. Make the intro contain only the heading and existing description:

```astro
<section class="intro">
  <div>
    <h1>соберите план дня</h1>
    <p class="lede">запишите дела и сохраните план. При необходимости покажите только свободное время</p>
  </div>
</section>
```

- [ ] Replace the export hint with plain text `<p class="hint">данные остаются на устройстве</p>`, keeping the existing `hint` and `save-status` classes so the privacy copy stays neutral and free of decorative symbols.
- [ ] Keep `ваш день` and `карточка дня` as useful section landmarks; their visual weight is adjusted in CSS.
- [ ] Run `rg -n "всё остаётся|тихий ритм|intro-note|intro-note-mark|↳" src/pages/index.astro`; expect no matches.
- [ ] Commit with `git add src/pages/index.astro && git commit -m "refactor: simplify dayflow hero copy"`.

### Task 2: Replace palette and add shared visual tokens

**Files:** `src/styles/global.css:1-38`

- [ ] Replace the root and dark theme variables with:

```css
:root {
  --bg: #f8f1ed; --surface: #fffaf6; --paper: #fffdf9; --ink: #2b2733;
  --muted: #766f7b; --line: #e7dce0; --accent: #bd6f79; --accent-soft: #f3dfe1;
  --warning: #a76451; --shadow: 0 18px 42px rgba(62, 39, 50, .08);
  --radius-sm: 10px; --radius-md: 16px; --radius-lg: 24px;
  font-family: "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
}
html.dark {
  --bg: #1b1723; --surface: #272131; --paper: #30263a; --ink: #fbf1ee;
  --muted: #cbbbc3; --line: #4a3a50; --accent: #e6a6a3; --accent-soft: #4a2f3a;
  --warning: #efb08b; --shadow: 0 18px 42px rgba(5, 3, 10, .26);
}
```

- [ ] Update focus rings to use `3px solid color-mix(in srgb, var(--accent) 52%, transparent)` with `3px` offset.
- [ ] Run `rg -n "#16764e|#f5f6f1|#101a14|#a8dfb9|#e4efe7" src/styles/global.css`; expect no matches after preview rules are updated in Task 4.
- [ ] Commit with `git add src/styles/global.css && git commit -m "style: establish warm pastel dayflow palette"`.

### Task 3: Add rounded tactile surfaces and remove flat neuro patterns

**Files:** `src/styles/global.css:40-190`

- [ ] Set `.topbar` to a bordered `var(--radius-md)` surface with `padding: 18px 20px`; set `.intro` to `padding: 76px 8px 48px` with no bottom divider.
- [ ] Style `.document-bar` as a bordered, rounded `var(--surface)` panel with `padding: 20px` and `box-shadow: var(--shadow)`; preserve the existing grid columns.
- [ ] Style `.planner` and `.export` as bordered `var(--radius-lg)` surfaces with `background: var(--surface)`, `box-shadow: var(--shadow)`, and `padding: 26px`.
- [ ] Convert date/label inputs and preset select to filled `var(--paper)` fields with `1px solid var(--line)`, `border-radius: var(--radius-sm)`, and `padding: 11px 12px`.
- [ ] Convert `.text-action` to a rose-tinted compact rounded action; convert `.mode-switch` to a rounded segmented control with the active tab on `var(--surface)`.
- [ ] Convert `.summary-strip` to a tinted rounded strip and `.lesson` to an individual bordered card with `margin-top: 12px`, `border-radius: var(--radius-md)`, `background: var(--paper)`, `padding: 18px`, and a subtle shadow.
- [ ] In the existing mobile media query, add `padding: 18px` to `.planner, .export` and `border-radius: var(--radius-md)` to `.document-bar`; preserve the lesson grid and keyboard order.
- [ ] Commit with `git add src/styles/global.css && git commit -m "style: add rounded schedule surfaces"`.

### Task 4: Align preview and export controls

**Files:** `src/styles/global.css:191-310`, `src/pages/index.astro`

- [ ] Update `.preview-card` to warm paper variables (`#fffdf9`, `#2b2733`, `#766f7b`, `#e7dce0`, `#a95e6d`), `border-radius: var(--radius-md)`, and a soft shadow. Update dark preview values to `#30263a`, `#fbf1ee`, `#cbbbc3`, `#4a3a50`, `#e6a6a3`.
- [ ] Round `.style`, `.mini-card`, `.primary`, and `.secondary` using `var(--radius-sm)` or `var(--radius-md)`. Use rose active/hover states and preserve labels and IDs.
- [ ] Style `.hint` as a centered quiet line with muted text and no decorative arrow or symbol.
- [ ] Run `rg -n "intro-note|intro-note-mark|↳|#16764e|#326249" src/pages/index.astro src/styles/global.css`; expect no matches.
- [ ] Commit with `git add src/styles/global.css src/pages/index.astro && git commit -m "style: polish dayflow preview and export controls"`.

### Task 5: Verify automated and browser behavior

**Files:** `src/lib/*.test.ts`, `tests/layout-check.py`, `tests/browser-check.py`

- [ ] Run `npm test`; expect exit code 0 and all Vitest tests passing.
- [ ] Run `npm run build`; expect Astro check and production build to complete with exit code 0.
- [ ] Run `python3 tests/layout-check.py` and `python3 tests/browser-check.py`; expect both to exit 0.
- [ ] In Chrome at `http://localhost:4321/`, verify hero starts directly with `соберите план дня`, no eyebrow/arrow appears, surfaces are warm pastel and rounded, privacy reads `данные остаются на устройстве`, theme toggle works, and no horizontal scroll appears at 390px.
- [ ] Run `git diff HEAD~4..HEAD --stat` and `git status --short`; confirm only documented UI/spec/plan files changed and no `dist/` artifacts are committed.

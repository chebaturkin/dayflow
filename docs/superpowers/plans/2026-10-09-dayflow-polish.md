# dayflow Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved warm editorial visual refresh to dayflow, then verify and fix any real UX, accessibility, or responsive regressions without changing planner behavior or export formats.

**Architecture:** Keep the single Astro page, its browser-only state/rendering script, and the existing schedule/export library intact. Change copy in `src/pages/index.astro`, centralize visual tokens and surface styling in `src/styles/global.css`, and add only focused browser assertions if verification exposes a regression. Preserve every existing DOM id, data attribute, event handler, localStorage key, and export filename contract.

**Tech Stack:** Astro 5, TypeScript, plain CSS, Vitest, Python Playwright smoke checks.

---

### Task 1: Simplify hero and privacy copy

**Files:**
- Modify: `src/pages/index.astro:15-36, 132-136`
- Test: `tests/browser-check.py`

- [ ] **Step 1: Update the hero markup**

Remove the `всё остаётся в браузере` eyebrow and the entire `.intro-note` block. The intro must become:

```astro
<section class="intro">
  <div>
    <h1>соберите план дня</h1>
    <p class="lede">запишите дела и сохраните план. При необходимости покажите только свободное время</p>
  </div>
</section>
```

Replace the export hint with:

```astro
<p class="hint"><span aria-hidden="true">⌁</span> данные остаются на устройстве</p>
```

Keep the `hint` and `save-status` classes and every existing id unchanged.

- [ ] **Step 2: Add browser assertions for the new copy**

In `tests/browser-check.py`, after the first page reload and before screenshots, assert:

```python
assert page.locator("h1").inner_text() == "соберите план дня"
assert page.locator(".intro-note").count() == 0
assert "данные остаются на устройстве" in page.locator(".hint").inner_text()
```

- [ ] **Step 3: Run the focused smoke test after starting the dev server**

Run: `npm run dev -- --host 127.0.0.1 > /tmp/dayflow-dev.log 2>&1 & echo $! > /tmp/dayflow-dev.pid; sleep 2; python3 tests/browser-check.py`

Expected: the test reaches the download assertions without an assertion failure.

- [ ] **Step 4: Commit the copy change**

```bash
git add src/pages/index.astro tests/browser-check.py
git commit -m "refactor: simplify dayflow hero copy"
```

---

### Task 2: Establish the warm visual tokens and accessible focus states

**Files:**
- Modify: `src/styles/global.css:1-38`

- [ ] **Step 1: Replace the theme variables**

Use these exact tokens at the start of `src/styles/global.css`:

```css
:root {
  --bg: #f8f1ed;
  --surface: #fffaf6;
  --paper: #fffdf9;
  --ink: #2b2733;
  --muted: #766f7b;
  --line: #e7dce0;
  --accent: #bd6f79;
  --accent-soft: #f3dfe1;
  --warning: #a76451;
  --shadow: 0 18px 42px rgba(62, 39, 50, .08);
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  font-family: "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
}

html.dark {
  --bg: #1b1723;
  --surface: #272131;
  --paper: #30263a;
  --ink: #fbf1ee;
  --muted: #cbbbc3;
  --line: #4a3a50;
  --accent: #e6a6a3;
  --accent-soft: #4a2f3a;
  --warning: #efb08b;
  --shadow: 0 18px 42px rgba(5, 3, 10, .26);
}
```

- [ ] **Step 2: Update focus styling**

Replace the global focus rule with:

```css
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent) 52%, transparent);
  outline-offset: 3px;
}
```

- [ ] **Step 3: Check stale palette tokens**

Run: `rg -n "#16764e|#f5f6f1|#101a14|#a8dfb9|#e4efe7" src/styles/global.css`

Expected: matches may remain only in preview-specific rules that Task 4 updates; no match may remain in the root or dark theme blocks.

- [ ] **Step 4: Commit the token change**

```bash
git add src/styles/global.css
git commit -m "style: establish warm pastel dayflow palette"
```

---

### Task 3: Turn editor regions into tactile, responsive surfaces

**Files:**
- Modify: `src/styles/global.css:40-190`
- Test: `tests/layout-check.py`

- [ ] **Step 1: Style the page shell and controls**

Apply these rules while preserving the existing layout breakpoints and grid columns:

```css
.topbar { border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); box-shadow: var(--shadow); padding: 18px 20px; }
.intro { padding: 76px 8px 48px; border-bottom: 0; }
.document-bar { border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); box-shadow: var(--shadow); padding: 20px; }
.planner, .export { border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow); padding: 26px; }
.date-field input, .label-field input, .preset-label select { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--paper); padding: 11px 12px; }
.text-action { border: 1px solid color-mix(in srgb, var(--accent) 38%, var(--line)); border-radius: var(--radius-sm); background: var(--accent-soft); color: var(--ink); padding: 9px 12px; }
```

- [ ] **Step 2: Style summary, mode switch, and lesson cards**

Use a rounded tinted summary strip, a rounded segmented mode switch, and individual event cards. The existing `.lesson` grid must remain intact so the mobile keyboard order continues to be time fields → title/note → status → row actions:

```css
.summary-strip { border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--line)); border-radius: var(--radius-sm); background: var(--accent-soft); padding: 13px 15px; }
.mode-switch { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--accent-soft); padding: 4px; }
.mode { border-radius: 8px; padding: 8px 10px 10px; }
.mode.active { border-bottom-color: transparent; background: var(--surface); box-shadow: 0 2px 8px rgba(62, 39, 50, .08); }
.lesson { margin-top: 12px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--paper); box-shadow: 0 8px 20px rgba(62, 39, 50, .05); padding: 18px; }
```

- [ ] **Step 3: Add mobile surface spacing**

Inside the existing `@media (max-width: 640px)` block, add:

```css
.document-bar { border-radius: var(--radius-md); }
.planner, .export { padding: 18px; border-radius: var(--radius-md); }
```

Do not change `.lesson` grid placement or keyboard-related DOM order.

- [ ] **Step 4: Run layout verification**

Run: `python3 tests/layout-check.py`

Expected: `Layout checked at 9 viewport widths: no overlaps or horizontal overflow.`

- [ ] **Step 5: Commit the surfaces change**

```bash
git add src/styles/global.css tests/layout-check.py
git commit -m "style: add rounded schedule surfaces"
```

---

### Task 4: Align the preview card and export controls

**Files:**
- Modify: `src/styles/global.css:191-310`
- Modify: `src/pages/index.astro:132-136`

- [ ] **Step 1: Update preview palettes and output styling**

Set the preview variables and dark overrides to:

```css
.preview-card { --card-paper: #fffdf9; --card-ink: #2b2733; --card-muted: #766f7b; --card-line: #e7dce0; --card-accent: #a95e6d; border-radius: var(--radius-md); box-shadow: var(--shadow); }
.preview-card[data-style="dark"] { --card-paper: #30263a; --card-ink: #fbf1ee; --card-muted: #cbbbc3; --card-line: #4a3a50; --card-accent: #e6a6a3; }
```

Round `.style`, `.mini-card`, `.primary`, and `.secondary` with `var(--radius-sm)` or `var(--radius-md)`. Use `var(--accent)` for active and hover emphasis. Preserve all existing labels and data attributes.

- [ ] **Step 2: Style the privacy hint**

Add:

```css
.hint { display: flex; align-items: center; justify-content: center; gap: 6px; }
.hint span { color: var(--accent); font-size: 16px; line-height: 1; }
```

Do not add an arrow or change the status message behavior.

- [ ] **Step 3: Check that removed visual signals are gone**

Run: `rg -n "intro-note|intro-note-mark|↳|#16764e|#326249" src/pages/index.astro src/styles/global.css`

Expected: no matches.

- [ ] **Step 4: Commit the preview polish**

```bash
git add src/styles/global.css src/pages/index.astro
git commit -m "style: polish dayflow preview and export controls"
```

---

### Task 5: Run the complete verification and repair confirmed regressions

**Files:**
- Modify only files implicated by a failing check; do not change exported behavior without a focused test.

- [ ] **Step 1: Run unit tests**

Run: `npm test`

Expected: all Vitest files pass with 15 or more tests and 0 failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Astro check reports 0 errors, 0 warnings, 0 hints, and the static build completes successfully.

- [ ] **Step 3: Run browser smoke tests**

Run: `python3 tests/browser-check.py`

Expected: mode switching, conflict messaging, JSON round-trip, ICS download, PNG download, theme switching, and 390px behavior all pass.

- [ ] **Step 4: Inspect for accidental artifacts**

Run: `git diff --check && git status --short`

Expected: no whitespace errors, no committed `dist/` files, and only the documented source/spec/plan files plus any focused verification fix are changed.

- [ ] **Step 5: Stop the local server and report evidence**

Run: `if [ -f /tmp/dayflow-dev.pid ]; then kill "$(cat /tmp/dayflow-dev.pid)" 2>/dev/null || true; fi`

Record the exact command outputs and list any residual limitations before claiming completion.

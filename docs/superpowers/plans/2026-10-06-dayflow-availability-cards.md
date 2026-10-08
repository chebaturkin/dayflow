# dayflow availability cards Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Turn dayflow into a local-first schedule card maker with private availability exports, automatic free-window/conflict summaries, and portable JSON/ICS exports.

**Architecture:** Keep the static Astro shell and browser-only state. Put schedule derivations and serializers in pure TypeScript modules, then let the page script render the editor and two card modes. Store a versioned document in localStorage and never send schedule data to a server.

**Tech Stack:** Astro 5, TypeScript, Vitest, Canvas API, localStorage.

---

### Task 1: document the product direction

**Files:**
- Create: docs/superpowers/specs/2026-10-06-dayflow-availability-cards-design.md
- Create: docs/superpowers/plans/2026-10-06-dayflow-availability-cards.md

- [ ] Save the approved product direction, data model, visual rules and verification criteria.
- [ ] Self-review the files for placeholders, inconsistent names and requirements without an implementation task.
- [ ] Commit with docs: define availability card direction.

### Task 2: extend pure schedule calculations

**Files:**
- Modify: src/lib/schedule.ts
- Modify: src/lib/schedule.test.ts

- [ ] Add ScheduleDocument, FreeWindow, ScheduleSummary and Conflict types.
- [ ] Add freeWindows(lessons, minimumMinutes = 30), treating cancelled events as absent and returning chronological gaps.
- [ ] Add conflicts(lessons) for overlapping active intervals, including IDs and display times.
- [ ] Add summarizeSchedule(lessons) for active count, total minutes, first start, last end, free-window count and conflict count.
- [ ] Test gaps, cancelled events, adjacent events, overlaps and empty schedules.
- [ ] Run npm test -- --run src/lib/schedule.test.ts; expect all schedule tests to pass.
- [ ] Commit with feat: add schedule availability calculations.

### Task 3: improve ICS and portable document export

**Files:**
- Modify: src/lib/ics.ts
- Create: src/lib/document.ts
- Modify: src/lib/ics.test.ts
- Create: src/lib/document.test.ts

- [ ] Add lessonsToIcs(date, lessons) that emits one active VEVENT per lesson and excludes cancelled lessons.
- [ ] Add versioned ScheduleDocument serialization and safe parsing with a clear DocumentParseError.
- [ ] Test multi-event ICS, cancelled exclusion, JSON round-trip and malformed input rejection.
- [ ] Run npm test -- --run src/lib/ics.test.ts src/lib/document.test.ts; expect all tests to pass.
- [ ] Commit with feat: add portable schedule document exports.

### Task 4: rebuild the editor around availability

**Files:**
- Modify: src/pages/index.astro
- Modify: src/styles/global.css

- [ ] Add a date field, optional day label and an explicit mode switch with plan and availability.
- [ ] Add a summary strip for active events, scheduled time and free windows.
- [ ] Add conflict messaging, per-row duration and a compact note field for export context.
- [ ] Add keyboard-safe controls for duplicate, delete and download ICS; preserve existing add, preset, status and theme behavior.
- [ ] Add JSON export/import, reset-to-demo and undo for the last destructive action.
- [ ] Store the v2 document and migrate the old lesson-only localStorage value.
- [ ] Render the preview with both modes, free-window labels and a clear “prepared in dayflow” footer.
- [ ] Keep the existing three styles, but refine them for flat paper output and availability hatch lines.
- [ ] Run npm run build; expect Astro type-check and static build to pass.
- [ ] Commit with feat: add availability editor and portable actions.

### Task 5: improve canvas output and public documentation

**Files:**
- Modify: src/pages/index.astro
- Modify: README.md
- Modify: tests/browser-check.py

- [ ] Render plan and availability modes to PNG with the selected date, day label, summary and footer.
- [ ] Use a generated filename containing the date and mode.
- [ ] Add a browser smoke test for mode switching, conflict warning, JSON import/export controls and PNG action.
- [ ] Update README around the concrete use case: send a beautiful schedule or a private availability card without an account.
- [ ] Run npm test && npm run build and the browser smoke test; expect all checks to pass.
- [ ] Commit with docs: explain availability cards.

### Task 6: final verification

**Files:**
- No new files unless a verification fix is needed.

- [ ] Inspect the final diff for accidental generated files and stale “planner” language.
- [ ] Run npm test, npm run build and git status --short.
- [ ] Check the page at 390px and 1440px in light and dark themes.
- [ ] Commit any small verification fix with a focused message.


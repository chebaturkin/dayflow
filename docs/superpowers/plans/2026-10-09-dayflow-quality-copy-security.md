# dayflow quality, copy and security refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** привести dayflow к единому ясному голосу, укрепить границы импортируемых данных и опубликовать проверяемую статическую версию на GitHub Pages.

**Architecture:** оставить Astro-страницу и текущую модель расписания, вынести только повторяющиеся лимиты документа в `src/lib/document.ts`, а пользовательские тексты и визуальные решения обновить в существующем `src/pages/index.astro` и `src/styles/global.css`. GitHub Pages будет собираться отдельным workflow из `dist` с base path `/dayflow/`.

**Tech Stack:** Astro 5, TypeScript, Vitest, Playwright, GitHub Actions Pages.

---

### Task 1: Защитить импорт документов и ICS от повреждённых строк

**Files:**
- Modify: `src/lib/document.ts`
- Modify: `src/lib/ics.ts`
- Test: `src/lib/document.test.ts`
- Test: `src/lib/ics.test.ts`

- [ ] **Step 1: Write failing document-boundary tests**

Добавить в `src/lib/document.test.ts` проверки, которые требуют отказа для неверной даты, слишком длинного названия события, небезопасного id и документа более чем с 200 событиями:

```ts
it('rejects documents outside import limits', () => {
  expect(() => parseDocument(JSON.stringify({ ...validDocument, date: '2026-02-31' }))).toThrow(DocumentParseError);
  expect(() => parseDocument(JSON.stringify({
    ...validDocument,
    lessons: [{ ...validDocument.lessons[0], title: 'x'.repeat(241) }],
  }))).toThrow(DocumentParseError);
  expect(() => parseDocument(JSON.stringify({
    ...validDocument,
    lessons: [{ ...validDocument.lessons[0], id: 'event\\nuid' }],
  }))).toThrow(DocumentParseError);
  expect(() => parseDocument(JSON.stringify({
    ...validDocument,
    lessons: Array.from({ length: 201 }, (_, index) => ({
      ...validDocument.lessons[0], id: `event-${index}`,
    })),
  }))).toThrow(DocumentParseError);
});
```

Заменить `validDocument` на существующую тестовую фикстуру `document`, сохранив текущие проверки round-trip и дубликатов.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/lib/document.test.ts`

Expected: FAIL because the current parser accepts the invalid date, long title, unsafe id and 201 events.

- [ ] **Step 3: Write the minimal document validation**

В `src/lib/document.ts` добавить константы `MAX_LESSONS = 200`, `MAX_ID_LENGTH = 128`, `MAX_TITLE_LENGTH = 240`, `MAX_NOTE_LENGTH = 500`, `MAX_LABEL_LENGTH = 80`; проверять дату через регулярное выражение и round-trip через `Date.UTC`, id через `/^[A-Za-z0-9._-]+$/`, а строки через лимиты. В `parseDocument` проверять лимит событий и label до проверки массива.

- [ ] **Step 4: Write the failing ICS newline test**

Добавить в `src/lib/ics.test.ts` проверку, что `lessonToIcs` не создаёт новую ICS-строку из carriage return в `SUMMARY` или `DESCRIPTION`:

```ts
it('escapes carriage returns in text properties', () => {
  const ics = lessonToIcs('2026-10-06', {
    id: 'safe-id', title: 'название\\rX', start: '09:00', end: '10:00',
    status: 'planned', note: 'заметка\\rX',
  });
  expect(ics).toContain('SUMMARY:название\\nX');
  expect(ics).toContain('DESCRIPTION:заметка\\nX');
  expect(ics).not.toContain('\\rX');
});
```

- [ ] **Step 5: Run the focused ICS test and verify RED**

Run: `npm test -- src/lib/ics.test.ts`

Expected: FAIL because `escape` currently replaces only `\\n`.

- [ ] **Step 6: Implement ICS escaping and run focused GREEN tests**

Изменить `escape` в `src/lib/ics.ts`, заменив `\\r` на `\\n` после обработки обратных слешей, затем запустить `npm test -- src/lib/document.test.ts src/lib/ics.test.ts` и убедиться, что все тесты проходят.

- [ ] **Step 7: Commit the security slice**

```bash
git add src/lib/document.ts src/lib/document.test.ts src/lib/ics.ts src/lib/ics.test.ts
git commit -m "fix: bound imported schedules and escape ICS text"
```

### Task 2: Переписать интерфейсный текст и метаданные в стиле Chebaturkin

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write the copy contract into the existing UI structure**

Сохранить текущие id и aria-связи, но заменить видимые строки на конкретные действия: hero объясняет «соберите план и сохраните одной картинкой», кнопки называют сохранение PNG/ICS/JSON, импорт говорит «открыть JSON», reset — «вернуть пример», ошибки содержат способ исправления. Исправить `GitHub`, `PNG`, `ICS`, `JSON` там, где это имя или формат, а обычные русские строки оставить со строчной.

- [ ] **Step 2: Add accessible metadata and base-safe link**

Добавить `meta name="theme-color"`, `meta property="og:title"`, `og:description`, `og:type` и `og:url`; использовать `import.meta.env.BASE_URL` для wordmark-ссылки. Добавить `maxlength` для названия и заметки в динамической строке, чтобы UI и импортная граница совпадали.

- [ ] **Step 3: Align dynamic messages and export labels**

Обновить строки `showSaved`, placeholder, пустое состояние, конфликт, подпись репозитория и текст на Canvas, не меняя вычисления расписания. Ошибка импорта должна показывать `error.message` из безопасного набора сообщений и запасную понятную подсказку.

- [ ] **Step 4: Refine responsive and theme styling**

В `src/styles/global.css` сохранить текущую редакционную сетку, но усилить контраст muted-текста, focus-visible, мобильное складывание `.document-bar`, `.layout`, `.lesson`, `.section-head` и экспортных кнопок. Проверить обе темы и не использовать системные фиолетовые градиенты или шаблонные карточки.

- [ ] **Step 5: Run typecheck/build before repository docs**

Run: `npm run build`

Expected: `astro check` and `astro build` finish with exit code 0.

### Task 3: Настроить GitHub Pages и обновить репозиторную витрину

**Files:**
- Modify: `astro.config.mjs`
- Modify: `README.md`
- Create: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Configure Astro for the project site**

В `astro.config.mjs` задать `site: 'https://chebaturkin.github.io'` и `base: '/dayflow'`, сохранив `output: 'static'` и выключенный dev toolbar.

- [ ] **Step 2: Add the Pages workflow**

Создать workflow на push в `main` и manual dispatch с `actions/checkout`, `actions/setup-node`, `npm ci`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact` и `actions/deploy-pages`; задать `permissions: contents: read, pages: write, id-token: write` и `environment: github-pages`.

- [ ] **Step 3: Rewrite README around reader questions**

Начать с пользы и приватности, затем коротко описать режимы, экспорт, локальное хранение, запуск, проверку, Pages URL и MIT. Убрать повторы и формулировки, которые обещают больше фактического поведения.

- [ ] **Step 4: Verify generated paths**

Run: `npm run build && test -f dist/index.html && rg -n '/dayflow|_astro' dist/index.html`

Expected: build succeeds and generated assets resolve under `/dayflow/`.

- [ ] **Step 5: Commit the product and Pages slice**

```bash
git add src/pages/index.astro src/styles/global.css astro.config.mjs README.md .github/workflows/deploy-pages.yml
git commit -m "feat: polish dayflow copy and publish pages site"
```

### Task 4: Проверить пользовательские сценарии и обновить GitHub metadata

**Files:**
- Modify: `tests/browser-check.py` only if accessible labels changed
- Modify: `tests/layout-check.py` only if selectors changed

- [ ] **Step 1: Run all unit tests**

Run: `npm test`

Expected: all test files pass with zero failures.

- [ ] **Step 2: Run browser smoke and layout checks**

Start `npm run dev -- --host 127.0.0.1` in a separate process, then run `python tests/browser-check.py` and `python tests/layout-check.py`.

Expected: JSON/ICS/PNG downloads, conflict warning, dark mode, availability mode and all viewport widths pass.

- [ ] **Step 3: Update GitHub repository description and topics**

Use authenticated `gh api` to set the factual description `план дня в одной картинке — локально, без регистрации` and keep the existing relevant topics (`astro`, `local-first`, `planner`, `productivity`, `typescript`). Do not edit issues, releases or unrelated settings.

- [ ] **Step 4: Push main and inspect Pages status**

Run: `git push origin main`, then `gh run list --workflow deploy-pages.yml --limit 1` and `gh api repos/chebaturkin/dayflow/pages`.

Expected: workflow is queued or completed, and Pages endpoint becomes available after GitHub finishes deployment.

- [ ] **Step 5: Final verification before reporting**

Run `git status --short --branch`, `npm test`, `npm run build`, smoke/layout checks, and inspect `git diff origin/main...HEAD --stat`. Report only statuses supported by fresh command output.

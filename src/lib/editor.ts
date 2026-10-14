import { activeLessons, availabilityBlocks, durationMinutes, nextEventSlot, sortLessons, summarizeSchedule, type Lesson, type ScheduleDocument } from './schedule';
import { lessonsToIcs } from './ics';
import { parseDocument, serializeDocument } from './document';
import { DocumentHistory } from './history';
import { scheduleAsText } from './share';
import { renderPng } from './png';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const store = (key: string, value: string) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
const now = new Date();
const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
const samples: Record<string, Lesson[]> = {
  study: [
    { id: 'study-design', title: 'дизайн-системы', start: '09:00', end: '10:30', status: 'planned' },
    { id: 'study-english', title: 'английский', start: '11:40', end: '13:10', status: 'planned' },
    { id: 'study-studio', title: 'практика в студии', start: '13:40', end: '15:10', status: 'moved', note: 'аудитория 204' },
  ],
  work: [
    { id: 'work-sync', title: 'командная встреча', start: '10:00', end: '10:30', status: 'planned' },
    { id: 'work-focus', title: 'время для фокуса', start: '11:00', end: '13:00', status: 'planned' },
    { id: 'work-review', title: 'разбор задач', start: '15:30', end: '16:15', status: 'planned' },
  ],
};
const cloneLessons = (value: Lesson[]) => value.map((lesson) => ({ ...lesson }));
const makeId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2);
const plural = (amount: number, forms: string[]) => {
  const last = amount % 10, tens = amount % 100;
  return tens >= 11 && tens <= 14 ? forms[2] : last === 1 ? forms[0] : last >= 2 && last <= 4 ? forms[1] : forms[2];
};
const wordForEvents = (n: number) => plural(n, ['событие', 'события', 'событий']);
const wordForWindows = (n: number) => plural(n, ['окно', 'окна', 'окон']);
const formatDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return [hours ? hours + ' ч' : '', rest ? rest + ' мин' : ''].filter(Boolean).join(' ') || '0 мин';
};
const fallbackDocument = (): ScheduleDocument => ({ version: 2, date: today, label: '', lessons: cloneLessons(samples.study) });
const readDocument = () => {
  try {
    const saved = stored('dayflow-document');
    if (saved) return parseDocument(saved);
    const legacy = stored('dayflow-lessons');
    if (legacy) return parseDocument(JSON.stringify({ version: 2, date: today, label: '', lessons: JSON.parse(legacy) }));
  } catch { /* Open the example when older or damaged data cannot be read. */ }
  return fallbackDocument();
};
let documentState = readDocument();
let style = ['clean', 'dark', 'lines'].includes(stored('dayflow-style') || '') ? stored('dayflow-style')! : 'clean';
let mode: 'plan' | 'availability' = stored('dayflow-mode') === 'availability' ? 'availability' : 'plan';
const history = new DocumentHistory(serializeDocument(documentState));
const root = $('#lessons');
const card = $('#preview-card');
const signature = $<HTMLInputElement>('#signature');
const dateInput = $<HTMLInputElement>('#date');
const labelInput = $<HTMLInputElement>('#label');
const undoButton = $<HTMLButtonElement>('#undo');
const redoButton = $<HTMLButtonElement>('#redo');
const fileMenu = $<HTMLDetailsElement>('.file-menu');
const editorStatus = $('#editor-status');
let messageTimer: ReturnType<typeof setTimeout>;
const showSaved = (message: string) => {
  clearTimeout(messageTimer);
  $('#save-status').textContent = message;
  messageTimer = setTimeout(() => { $('#save-status').textContent = ''; }, 4000);
};
const syncHistory = () => { undoButton.disabled = !history.canUndo; redoButton.disabled = !history.canRedo; };
const save = (group?: unknown) => {
  const value = serializeDocument(documentState);
  history.record(value, group);
  if (!store('dayflow-document', value)) editorStatus.textContent = 'браузер не сохранил изменения. скачайте расписание через меню «файл».';
  syncHistory();
};
const download = (data: Blob | string, name: string, type: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};
const updateDerived = () => {
  const derived = summarizeSchedule(documentState.lessons);
  const free = derived.freeWindows.length;
  $('#summary').innerHTML = '<span><strong>' + derived.activeCount + '</strong> ' + wordForEvents(derived.activeCount) + '</span>'
    + '<span>занято <strong>' + formatMinutes(derived.totalMinutes) + '</strong></span>'
    + '<span><strong>' + free + '</strong> ' + wordForWindows(free) + ' свободно</span>';
  const conflict = $('#conflict');
  conflict.hidden = !derived.conflicts.length;
  conflict.textContent = derived.conflicts.length ? 'события пересекаются в ' + derived.conflicts[0].start + ' - ' + derived.conflicts[0].end + '. проверьте время.' : '';
  $('#empty-editor').hidden = documentState.lessons.length > 0;
};
const renderCard = () => {
  const derived = summarizeSchedule(documentState.lessons);
  const active = sortLessons(activeLessons(documentState.lessons));
  $('#count').textContent = derived.activeCount + ' ' + wordForEvents(derived.activeCount);
  card.dataset.style = style;
  card.dataset.mode = mode;
  $('#card-date').textContent = formatDate(documentState.date);
  $('#card-label').textContent = documentState.label.trim() || (mode === 'plan' ? 'план дня' : 'свободное время');
  $('#card-summary').innerHTML = '<span>занято ' + formatMinutes(derived.totalMinutes) + '</span><span>свободно ' + derived.freeWindows.length + ' ' + wordForWindows(derived.freeWindows.length) + '</span>';
  $('#card-footer').hidden = !signature.checked;
  const list = $('#card-lessons');
  list.replaceChildren();
  const makeLine = (start: string, end: string) => {
    const line = document.createElement('div');
    line.className = 'card-line';
    const time = document.createElement('time');
    for (const value of [start, end]) { const part = document.createElement('span'); part.textContent = value; time.append(part); }
    const body = document.createElement('div');
    line.append(time, body);
    return { line, body };
  };
  if (!active.length) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'нет событий'; list.append(empty);
  } else if (mode === 'plan') {
    active.forEach((lesson) => {
      const { line, body } = makeLine(lesson.start, lesson.end);
      const title = document.createElement('strong'); title.textContent = lesson.title || 'событие'; body.append(title);
      if (lesson.note) { const note = document.createElement('small'); note.textContent = lesson.note; body.append(note); }
      if (lesson.status === 'moved') { const mark = document.createElement('em'); mark.textContent = 'перенесено'; body.append(mark); }
      list.append(line);
    });
  } else {
    availabilityBlocks(documentState.lessons).forEach((block) => {
      const { line, body } = makeLine(block.start, block.end);
      line.classList.add(block.kind);
      const title = document.createElement('strong'); title.textContent = block.kind === 'free' ? 'свободно' : 'занято'; body.append(title);
      list.append(line);
    });
  }
};
const copyIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>';
const renderRows = () => {
  root.replaceChildren();
  sortLessons(documentState.lessons).forEach((lesson) => {
    const row = document.createElement('article');
    row.className = 'lesson ' + lesson.status;
    row.dataset.id = lesson.id;
    row.innerHTML = '<div class="time-fields"><label><span>с</span><input class="start" type="text" inputmode="numeric" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxlength="5" required aria-label="начало" /></label><label><span>до</span><input class="end" type="text" inputmode="numeric" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxlength="5" required aria-label="конец" /></label></div>'
      + '<div class="lesson-main"><input class="title" maxlength="240" aria-label="название события" placeholder="название события" /><input class="note" maxlength="500" aria-label="заметка" placeholder="добавить заметку" /></div>'
      + '<div class="lesson-bottom"><select class="status" aria-label="статус"><option value="planned">по плану</option><option value="moved">перенесено</option><option value="cancelled">отменено</option></select>'
      + '<div class="row-actions"><button class="duplicate" type="button" aria-label="создать копию" title="создать копию">' + copyIcon + '</button><button class="remove" type="button" aria-label="удалить событие" title="удалить событие">×</button></div></div>';
    const start = row.querySelector<HTMLInputElement>('.start')!, end = row.querySelector<HTMLInputElement>('.end')!;
    const title = row.querySelector<HTMLInputElement>('.title')!, note = row.querySelector<HTMLInputElement>('.note')!;
    const status = row.querySelector<HTMLSelectElement>('.status')!;
    start.value = lesson.start; end.value = lesson.end; title.value = lesson.title; note.value = lesson.note || ''; status.value = lesson.status;
    const updateText = (group?: HTMLElement) => {
      lesson.title = title.value; lesson.note = note.value; lesson.status = status.value as Lesson['status'];
      row.className = 'lesson ' + lesson.status;
      save(group); updateDerived(); renderCard();
    };
    const validTime = (value: string) => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
    const validRange = () => validTime(start.value) && validTime(end.value) && durationMinutes({ ...lesson, start: start.value, end: end.value }) > 0;
    const clearTimeErrors = () => {
      for (const field of [start, end]) { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); }
    };
    const updateTime = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const invalid = !validRange();
      input.setCustomValidity(invalid ? 'время окончания должно быть позже начала' : '');
      input.setAttribute('aria-invalid', String(invalid));
      if (invalid) { input.reportValidity(); return; }
      clearTimeErrors();
      lesson.start = start.value; lesson.end = end.value;
      save(input); updateDerived(); renderCard();
    };
    start.onchange = updateTime; end.onchange = updateTime;
    for (const input of [start, end]) input.oninput = () => {
      if (/^\d{4}$/.test(input.value)) input.value = input.value.slice(0, 2) + ':' + input.value.slice(2);
      if (validRange()) clearTimeErrors();
    };
    title.oninput = () => updateText(title); note.oninput = () => updateText(note); status.onchange = () => updateText();
    row.querySelector<HTMLButtonElement>('.duplicate')!.onclick = () => {
      if (documentState.lessons.length >= 200) { editorStatus.textContent = 'в одном дне может быть до 200 событий.'; return; }
      documentState.lessons.push({ ...lesson, id: makeId(), title: (lesson.title + ' · копия').slice(0, 240) });
      save(); render();
    };
    row.querySelector<HTMLButtonElement>('.remove')!.onclick = () => {
      documentState.lessons = documentState.lessons.filter((item) => item.id !== lesson.id);
      save(); render();
      editorStatus.textContent = 'событие удалено. его можно вернуть кнопкой отмены.';
      undoButton.focus();
    };
    root.append(row);
  });
};
const render = () => {
  dateInput.value = documentState.date; labelInput.value = documentState.label;
  $('#date-display').textContent = documentState.date.split('-').reverse().join('.');
  signature.checked = stored('dayflow-signature') !== 'false';
  document.querySelectorAll<HTMLButtonElement>('.mode').forEach((button) => { const active = button.dataset.mode === mode; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  document.querySelectorAll<HTMLButtonElement>('.style').forEach((button) => { const active = button.dataset.style === style; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  $('#copy-fallback').hidden = true;
  editorStatus.textContent = '';
  renderRows(); updateDerived(); renderCard(); syncHistory();
};
const travelHistory = (direction: 'undo' | 'redo') => {
  const value = history[direction]();
  if (!value) return;
  documentState = parseDocument(value); store('dayflow-document', value); render();
  editorStatus.textContent = direction === 'undo' ? 'изменение отменено' : 'изменение повторено';
};
undoButton.onclick = () => travelHistory('undo'); redoButton.onclick = () => travelHistory('redo');
document.addEventListener('focusout', () => history.endGroup());
$('#add').onclick = () => {
  const pending = document.activeElement;
  if (pending instanceof HTMLInputElement && (pending.closest('.time-fields') || pending === dateInput)) {
    pending.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const invalid = [dateInput, ...root.querySelectorAll<HTMLInputElement>('.time-fields input')].find((field) => !field.checkValidity());
  if (invalid) { invalid.reportValidity(); return; }
  if (pending instanceof HTMLInputElement) pending.blur();
  if (documentState.lessons.length >= 200) { editorStatus.textContent = 'в одном дне может быть до 200 событий.'; return; }
  const slot = nextEventSlot(documentState.lessons);
  if (!slot) { editorStatus.textContent = 'в расписании нет свободного часа. измените время одного из событий.'; return; }
  const id = makeId(); documentState.lessons.push({ id, title: '', ...slot, status: 'planned' }); save(); render();
  root.querySelector<HTMLInputElement>('[data-id="' + id + '"] .title')?.focus();
};
$<HTMLSelectElement>('#preset').onchange = (event) => {
  const select = event.target as HTMLSelectElement;
  if (!select.value) return;
  documentState.lessons = select.value === 'empty' ? [] : cloneLessons(samples[select.value]);
  save(); render(); select.value = '';
};
document.querySelectorAll<HTMLButtonElement>('.mode').forEach((button) => {
  button.onclick = () => { mode = button.dataset.mode as typeof mode; store('dayflow-mode', mode); render(); };
});
document.querySelectorAll<HTMLButtonElement>('.style').forEach((button) => {
  button.onclick = () => { style = button.dataset.style!; store('dayflow-style', style); render(); };
});
dateInput.onchange = () => {
  if (!dateInput.value || !dateInput.validity.valid) return;
  documentState.date = dateInput.value;
  $('#date-display').textContent = documentState.date.split('-').reverse().join('.');
  save(dateInput); renderCard();
};
labelInput.oninput = () => { documentState.label = labelInput.value; save(labelInput); renderCard(); };
signature.onchange = () => { store('dayflow-signature', String(signature.checked)); renderCard(); };
const setTheme = (theme: string) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const label = theme === 'dark' ? 'включить светлую тему' : 'включить тёмную тему';
  $('#theme').setAttribute('aria-label', label); $('#theme').setAttribute('title', label);
  $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#1e211c' : '#f5f3ed');
  store('dayflow-theme', theme);
};
$('#theme').onclick = () => setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
$('#ics').onclick = () => { download(lessonsToIcs(documentState.date, documentState.lessons), 'dayflow-' + documentState.date + '.ics', 'text/calendar'); showSaved('файл для календаря сохранён'); };
$('#export-json').onclick = () => { download(serializeDocument(documentState), 'dayflow-' + documentState.date + '.json', 'application/json'); showSaved('расписание сохранено'); };
$('#import').onclick = () => $<HTMLInputElement>('#file').click();
$<HTMLInputElement>('#file').onchange = async (event) => {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('файл слишком большой. выберите расписание из dayflow.');
    documentState = parseDocument(await file.text()); save(); render(); showSaved('расписание открыто');
  } catch (error) { showSaved(error instanceof Error ? error.message : 'не получилось открыть файл'); }
  input.value = '';
};
$('#reset').onclick = () => { documentState = fallbackDocument(); save(); render(); showSaved('пример восстановлен'); };
fileMenu.addEventListener('click', (event) => { if ((event.target as HTMLElement).closest('button')) fileMenu.open = false; });
document.addEventListener('click', (event) => { if (!fileMenu.contains(event.target as Node)) fileMenu.open = false; });
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') fileMenu.open = false;
  if (!(event.metaKey || event.ctrlKey)) return;
  if (event.key === 'Enter') { event.preventDefault(); $('#add').click(); }
  const inField = (event.target as HTMLElement).matches('input, textarea, [contenteditable="true"]');
  if (event.code === 'KeyZ' && !inField) { event.preventDefault(); travelHistory(event.shiftKey ? 'redo' : 'undo'); }
});
$('#copy-text').onclick = async () => {
  const text = scheduleAsText(documentState, mode);
  try { await navigator.clipboard.writeText(text); $('#copy-fallback').hidden = true; showSaved('текст скопирован'); }
  catch { $('#copy-fallback').hidden = false; const field = $<HTMLTextAreaElement>('#share-text'); field.value = text; field.focus(); field.select(); showSaved('браузер не дал доступ к буферу обмена'); }
};
$('#png').onclick = async () => {
  const button = $<HTMLButtonElement>('#png'); button.disabled = true;
  try { await document.fonts.ready; const blob = await renderPng(documentState, style, mode, signature.checked); download(blob, 'dayflow-' + documentState.date + '-' + mode + '.png', 'image/png'); showSaved('картинка сохранена'); }
  catch { showSaved('не получилось сохранить картинку. попробуйте ещё раз.'); }
  finally { button.disabled = false; }
};
setTheme(stored('dayflow-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
render();

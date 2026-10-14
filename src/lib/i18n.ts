export type Language = 'ru' | 'en';
export const translations: Record<string, string> = {
  "план на день": "plan your day",
  "запишите дела и отправьте расписание": "write down your plans and share your day",
  "тем, с кем нужно договориться.": "with the people who need to know.",
  "навигация": "navigation",
  "включить тёмную тему": "use dark theme",
  "включить светлую тему": "use light theme",
  "расписание": "schedule",
  "отменить изменение": "undo change",
  "повторить изменение": "redo change",
  "отменить изменение (ctrl / ⌘ + z)": "undo change (ctrl / ⌘ + z)",
  "повторить изменение (ctrl / ⌘ + shift + z)": "redo change (ctrl / ⌘ + shift + z)",
  "файл": "file",
  "открыть расписание": "open schedule",
  "сохранить расписание": "save schedule",
  "добавить в календарь": "add to calendar",
  "вернуть пример": "restore example",
  "данные дня": "day details",
  "дата": "date",
  "название дня": "name your day",
  "например, рабочая среда": "for example, wednesday at work",
  "пока ничего не запланировано.": "nothing planned yet.",
  "добавьте событие или выберите пример.": "add an event or choose an example.",
  "добавить событие": "add event",
  "выбрать пример": "choose an example",
  "или взять пример": "or try an example",
  "учебный день": "study day",
  "рабочий день": "work day",
  "начать с пустого листа": "start fresh",
  "карточка": "card",
  "содержание карточки": "card content",
  "план дня": "day plan",
  "свободное время": "free time",
  "варианты оформления": "card styles",
  "бумага": "paper",
  "тёмная": "dark",
  "строки": "ruled",
  "подпись dayflow": "dayflow signature",
  "сохранить картинку": "save image",
  "скопировать текст": "copy text",
  "выделите и скопируйте текст": "select and copy the text",
  "дизайн-системы": "design systems",
  "английский": "english",
  "практика в студии": "studio practice",
  "аудитория 204": "room 204",
  "командная встреча": "team meeting",
  "время для фокуса": "focus time",
  "разбор задач": "task review",
  "браузер не сохранил изменения. скачайте расписание через меню «файл».": "your browser could not save these changes. download the schedule from the file menu.",
  "события пересекаются в {start} - {end}. проверьте время.": "events overlap at {start} - {end}. check their times.",
  "занято": "busy",
  "свободно": "free",
  "нет событий": "no events",
  "событие": "event",
  "перенесено": "rescheduled",
  "по плану": "planned",
  "отменено": "cancelled",
  "с": "from",
  "до": "to",
  "начало": "start",
  "конец": "end",
  "название события": "event name",
  "заметка": "note",
  "добавить заметку": "add a note",
  "статус": "status",
  "создать копию": "duplicate event",
  "удалить событие": "delete event",
  "время окончания должно быть позже начала": "the end time must be after the start",
  "в одном дне может быть до 200 событий.": "a day can contain up to 200 events.",
  " · копия": " · copy",
  "событие удалено. его можно вернуть кнопкой отмены.": "event deleted. use undo to bring it back.",
  "изменение отменено": "change undone",
  "изменение повторено": "change redone",
  "в расписании нет свободного часа. измените время одного из событий.": "there is no free hour left. adjust an event to make room.",
  "файл для календаря сохранён": "calendar file saved",
  "расписание сохранено": "schedule saved",
  "файл слишком большой. выберите расписание из dayflow.": "this file is too large. choose a schedule saved from dayflow.",
  "расписание открыто": "schedule opened",
  "не получилось открыть файл": "could not open this file",
  "пример восстановлен": "example restored",
  "текст скопирован": "text copied",
  "браузер не дал доступ к буферу обмена": "your browser did not allow clipboard access",
  "картинка сохранена": "image saved",
  "не получилось сохранить картинку. попробуйте ещё раз.": "could not save the image. please try again.",
  "не получилось создать картинку": "could not create the image",
  "файл не является корректным json": "this file is not valid json",
  "документ должен быть объектом": "the file must contain a schedule object",
  "это не файл dayflow версии 2": "choose a dayflow version 2 file",
  "в документе есть повторяющиеся занятия": "the file contains duplicate event identifiers",
  "соберите расписание на день и отправьте его картинкой или текстом. можно показать только свободное время.": "make a day plan to share as an image or text. you can show just your free time.",
  "dayflow: план дня одной картинкой": "dayflow: share your day",
  "расписание, которым удобно поделиться. картинкой, текстом или файлом для календаря.": "a day plan to share as an image, text or calendar file."
};
let language: Language = 'en';
const preferenceKey = 'dayflow-language';
export const resolveLanguage = (search: string, saved: string | null, languages: readonly string[]): Language => {
  const explicit = new URLSearchParams(search).get('lang');
  if (explicit === 'ru' || explicit === 'en') return explicit;
  if (saved === 'ru' || saved === 'en') return saved;
  for (const value of languages) {
    const primary = value.toLowerCase().split('-')[0];
    if (primary === 'ru' || primary === 'en') return primary;
  }
  return 'en';
};
export const getLanguage = () => language;
export const dateLocale = (locale: Language = language) => locale === 'ru' ? 'ru-RU' : 'en-GB';
export const t = (message: string, locale: Language = language, values: Record<string, string | number> = {}) => {
  const plain = message.trim();
  const text = locale === 'ru' ? message : translations[message] ?? (translations[plain] ? message.replace(plain, translations[plain]) : message);
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
};
export const pluralWord = (amount: number, kind: 'event' | 'window', locale: Language = language) => {
  if (locale === 'en') return kind + (amount === 1 ? '' : 's');
  const forms = kind === 'event' ? ['событие', 'события', 'событий'] : ['окно', 'окна', 'окон'];
  const last = amount % 10, tens = amount % 100;
  return tens >= 11 && tens <= 14 ? forms[2] : last === 1 ? forms[0] : last >= 2 && last <= 4 ? forms[1] : forms[2];
};
export const formatDuration = (minutes: number, locale: Language = language) => {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return [hours ? hours + (locale === 'ru' ? ' ч' : ' h') : '', rest ? rest + (locale === 'ru' ? ' мин' : ' min') : ''].filter(Boolean).join(' ') || (locale === 'ru' ? '0 мин' : '0 min');
};
const sourceMessage = (value: string) => Object.entries(translations).find(([, english]) => english === value)?.[0] ?? value;
export const writeMessage = (node: HTMLElement, message: string) => {
  const source = sourceMessage(message);
  node.dataset.i18nParts = JSON.stringify([source]);
  node.textContent = t(source);
};
export const applyBindings = (root: ParentNode = document) => {
  root.querySelectorAll<HTMLElement>('[data-i18n-parts]').forEach(node => {
    const parts: string[] = JSON.parse(node.dataset.i18nParts!);
    const nodes = [...node.childNodes].filter(child => child.nodeType === 3 && child.textContent?.trim());
    nodes.forEach((child, index) => { if (parts[index] !== undefined) child.textContent = t(parts[index]); });
  });
  for (const attribute of ['aria-label', 'title', 'placeholder', 'content', 'alt']) {
    root.querySelectorAll<HTMLElement>('[data-i18n-' + attribute + ']').forEach(node => node.setAttribute(attribute, t(node.getAttribute('data-i18n-' + attribute)!)));
  }
};
// This template contains authored row chrome only; user values are assigned afterward.
export const translateTemplate = (html: string) => {
  const template = document.createElement('template'); template.innerHTML = html;
  template.content.querySelectorAll<HTMLElement>('*').forEach(node => {
    const nodes = [...node.childNodes].filter(child => child.nodeType === 3 && child.textContent?.trim());
    if (nodes.some(child => translations[child.textContent!.trim()])) node.dataset.i18nParts = JSON.stringify(nodes.map(child => child.textContent!));
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      const value = node.getAttribute(attribute);
      if (value && translations[value]) node.setAttribute('data-i18n-' + attribute, value);
    }
  });
  applyBindings(template.content);
  return template.innerHTML;
};
const updateControls = () => {
  document.documentElement.lang = language;
  document.querySelectorAll<HTMLElement>('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
};
export const setLanguage = (next: Language) => {
  if (next !== 'ru' && next !== 'en') return;
  const changed = language !== next;
  language = next;
  try { localStorage.setItem(preferenceKey, next); } catch { /* Language works without storage. */ }
  try { const url = new URL(location.href); url.searchParams.set('lang', next); history.replaceState(null, '', url); } catch { /* Also works from a local file. */ }
  if (!changed) { updateControls(); return; }
  applyBindings(); updateControls();
  window.dispatchEvent(new CustomEvent('dayflow:languagechange'));
};
export const initI18n = () => {
  let saved = null;
  try { saved = localStorage.getItem(preferenceKey); } catch { /* Keep browser preference. */ }
  language = resolveLanguage(location.search, saved, navigator.languages || [navigator.language]);
  applyBindings(); updateControls();
  document.querySelectorAll<HTMLElement>('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language as Language)));
};

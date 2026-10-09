import type { Lesson, LessonStatus, ScheduleDocument } from './schedule';

export class DocumentParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentParseError';
  }
}

const isTime = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour < 24 && minute < 60;
};
const isStatus = (value: unknown): value is LessonStatus => value === 'planned' || value === 'moved' || value === 'cancelled';
const isDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const MAX_LESSONS = 200;
const MAX_ID_LENGTH = 128;
const MAX_TITLE_LENGTH = 240;
const MAX_NOTE_LENGTH = 500;
const MAX_LABEL_LENGTH = 80;

const isLesson = (value: unknown): value is Lesson => {
  if (!value || typeof value !== 'object') return false;
  const lesson = value as Partial<Lesson>;
  return typeof lesson.id === 'string' && /^[A-Za-z0-9._-]+$/.test(lesson.id) && lesson.id.length <= MAX_ID_LENGTH
    && typeof lesson.title === 'string' && lesson.title.length <= MAX_TITLE_LENGTH
    && isTime(lesson.start) && isTime(lesson.end)
    && isStatus(lesson.status)
    && (lesson.note === undefined || (typeof lesson.note === 'string' && lesson.note.length <= MAX_NOTE_LENGTH));
};

const hasPositiveInterval = (lesson: Lesson) => {
  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };
  return toMinutes(lesson.end) > toMinutes(lesson.start);
};

export const serializeDocument = (document: ScheduleDocument) => JSON.stringify(document, null, 2);

export const parseDocument = (value: string): ScheduleDocument => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new DocumentParseError('файл не является корректным JSON');
  }

  if (!parsed || typeof parsed !== 'object') throw new DocumentParseError('документ должен быть объектом');
  const document = parsed as Partial<ScheduleDocument>;
  if (document.version !== 2 || !isDate(document.date)
    || typeof document.label !== 'string' || document.label.length > MAX_LABEL_LENGTH
    || !Array.isArray(document.lessons) || document.lessons.length > MAX_LESSONS || !document.lessons.every(isLesson)
    || !document.lessons.every(hasPositiveInterval)) {
    throw new DocumentParseError('это не файл dayflow версии 2');
  }

  const ids = new Set(document.lessons.map((lesson) => lesson.id));
  if (ids.size !== document.lessons.length) throw new DocumentParseError('в документе есть повторяющиеся занятия');
  return { version: 2, date: document.date, label: document.label, lessons: document.lessons };
};

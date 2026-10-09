import { activeLessons, sortLessons, type Lesson } from './schedule';

const stamp = (date: string, time: string) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
const escape = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('\r\n', '\n').replaceAll('\r', '\n').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');

export const lessonToIcs = (date: string, lesson: Lesson) => [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//dayflow//EN', 'BEGIN:VEVENT',
  `UID:${lesson.id}@dayflow.local`, `DTSTART:${stamp(date, lesson.start)}`,
  `DTEND:${stamp(date, lesson.end)}`, `SUMMARY:${escape(lesson.title)}`,
  ...(lesson.note?.trim() ? [`DESCRIPTION:${escape(lesson.note.trim())}`] : []),
  'END:VEVENT', 'END:VCALENDAR', '',
].join('\r\n');

export const lessonsToIcs = (date: string, lessons: Lesson[]) => [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//dayflow//EN',
  'CALSCALE:GREGORIAN',
  ...sortLessons(activeLessons(lessons)).flatMap((lesson) => [
    'BEGIN:VEVENT',
    'UID:' + lesson.id + '@dayflow.local',
    'DTSTART:' + stamp(date, lesson.start),
    'DTEND:' + stamp(date, lesson.end),
    'SUMMARY:' + escape(lesson.title),
    ...(lesson.note?.trim() ? ['DESCRIPTION:' + escape(lesson.note.trim())] : []),
    'END:VEVENT',
  ]),
  'END:VCALENDAR',
  '',
].join('\r\n');

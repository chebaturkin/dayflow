import type { Lesson } from './schedule';

const stamp = (date: string, time: string) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
const escape = (value: string) => value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');

export const lessonToIcs = (date: string, lesson: Lesson) => [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//dayflow//EN', 'BEGIN:VEVENT',
  `UID:${lesson.id}@dayflow.local`, `DTSTART:${stamp(date, lesson.start)}`,
  `DTEND:${stamp(date, lesson.end)}`, `SUMMARY:${escape(lesson.title)}`, 'END:VEVENT', 'END:VCALENDAR', '',
].join('\r\n');

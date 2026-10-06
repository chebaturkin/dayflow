import { expect, it } from 'vitest';
import { lessonToIcs, lessonsToIcs } from './ics';

it('serializes a calendar event', () => {
  const ics = lessonToIcs('2026-10-06', { id: 'design', title: 'design, systems', start: '09:00', end: '10:30', status: 'planned' });
  expect(ics).toContain('DTSTART:20261006T090000');
  expect(ics).toContain('DTEND:20261006T103000');
  expect(ics).toContain('SUMMARY:design\\, systems');
  expect(ics).toContain('UID:design@dayflow.local');
});

it('serializes the active day and excludes cancelled lessons', () => {
  const ics = lessonsToIcs('2026-10-06', [
    { id: 'one', title: 'one', start: '09:00', end: '10:00', status: 'planned' },
    { id: 'cancelled', title: 'cancelled', start: '11:00', end: '12:00', status: 'cancelled' },
    { id: 'two', title: 'two', start: '13:00', end: '14:00', status: 'moved', note: 'bring notes' },
  ]);
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  expect(ics).not.toContain('SUMMARY:cancelled');
  expect(ics).toContain('DESCRIPTION:bring notes');
});

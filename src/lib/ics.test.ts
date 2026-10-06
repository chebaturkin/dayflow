import { expect, it } from 'vitest';
import { lessonToIcs } from './ics';

it('serializes a calendar event', () => {
  const ics = lessonToIcs('2026-10-06', { id: 'design', title: 'design, systems', start: '09:00', end: '10:30', status: 'planned' });
  expect(ics).toContain('DTSTART:20261006T090000');
  expect(ics).toContain('DTEND:20261006T103000');
  expect(ics).toContain('SUMMARY:design\\, systems');
  expect(ics).toContain('UID:design@dayflow.local');
});

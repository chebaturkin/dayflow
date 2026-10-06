import { describe, expect, it } from 'vitest';
import { activeLessons, durationMinutes, sortLessons, validateSchedule } from './schedule';

const lessons = [
  { id: 'late', title: 'studio practice', start: '13:40', end: '15:10', status: 'moved' as const },
  { id: 'early', title: 'design systems', start: '09:00', end: '10:30', status: 'planned' as const },
  { id: 'cancelled', title: 'english', start: '11:40', end: '13:10', status: 'cancelled' as const },
];

describe('schedule model', () => {
  it('sorts lessons by their start time', () => {
    expect(sortLessons(lessons).map((lesson) => lesson.id)).toEqual(['early', 'cancelled', 'late']);
  });

  it('calculates a lesson duration in minutes', () => {
    expect(durationMinutes(lessons[0])).toBe(90);
  });

  it('excludes cancelled lessons from active lessons', () => {
    expect(activeLessons(lessons).map((lesson) => lesson.id)).toEqual(['late', 'early']);
  });

  it('rejects duplicate lesson identifiers', () => {
    expect(() => validateSchedule({ date: '2026-10-06', lessons: [lessons[0], lessons[0]] })).toThrow('unique');
  });
});

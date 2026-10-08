import { describe, expect, it } from 'vitest';
import { activeLessons, conflicts, durationMinutes, freeWindows, sortLessons, summarizeSchedule, validateSchedule } from './schedule';

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

  it('finds meaningful free windows between active lessons', () => {
    expect(freeWindows([
      { id: 'one', title: 'one', start: '09:00', end: '10:00', status: 'planned' },
      { id: 'two', title: 'two', start: '10:20', end: '11:00', status: 'planned' },
      { id: 'three', title: 'three', start: '12:00', end: '13:00', status: 'planned' },
    ])).toEqual([{ start: '11:00', end: '12:00', minutes: 60 }]);
  });

  it('ignores cancelled lessons while finding windows', () => {
    expect(freeWindows([
      { id: 'one', title: 'one', start: '09:00', end: '10:00', status: 'planned' },
      { id: 'cancelled', title: 'cancelled', start: '10:15', end: '11:15', status: 'cancelled' },
      { id: 'two', title: 'two', start: '12:00', end: '13:00', status: 'planned' },
    ])).toEqual([{ start: '10:00', end: '12:00', minutes: 120 }]);
  });

  it('reports overlapping active lessons', () => {
    expect(conflicts([
      { id: 'one', title: 'one', start: '09:00', end: '10:30', status: 'planned' },
      { id: 'two', title: 'two', start: '10:00', end: '11:00', status: 'moved' },
    ])).toEqual([{ firstId: 'one', secondId: 'two', start: '10:00', end: '10:30' }]);
  });

  it('reports every overlap in a long block', () => {
    expect(conflicts([
      { id: 'long', title: 'long', start: '09:00', end: '12:00', status: 'planned' },
      { id: 'middle', title: 'middle', start: '10:00', end: '11:00', status: 'planned' },
      { id: 'late', title: 'late', start: '11:30', end: '13:00', status: 'planned' },
    ])).toEqual([
      { firstId: 'long', secondId: 'middle', start: '10:00', end: '11:00' },
      { firstId: 'long', secondId: 'late', start: '11:30', end: '12:00' },
    ]);
  });

  it('merges overlapping blocks before finding free windows', () => {
    expect(freeWindows([
      { id: 'long', title: 'long', start: '09:00', end: '12:00', status: 'planned' },
      { id: 'middle', title: 'middle', start: '10:00', end: '11:00', status: 'planned' },
      { id: 'late', title: 'late', start: '13:00', end: '14:00', status: 'planned' },
    ])).toEqual([{ start: '12:00', end: '13:00', minutes: 60 }]);
  });

  it('summarizes active time and gaps', () => {
    expect(summarizeSchedule(lessons)).toMatchObject({
      activeCount: 2,
      totalMinutes: 180,
      firstStart: '09:00',
      lastEnd: '15:10',
      freeWindows: [{ start: '10:30', end: '13:40', minutes: 190 }],
      conflicts: [],
    });
  });
});

import { describe, expect, it } from 'vitest';
import { scheduleAsText } from './share';
import type { ScheduleDocument } from './schedule';

const document: ScheduleDocument = {
  version: 2, date: '2026-10-14', label: 'рабочий день',
  lessons: [
    { id: 'two', title: 'встреча', start: '12:00', end: '13:00', status: 'moved', note: 'секретная заметка' },
    { id: 'one', title: 'подготовка', start: '09:00', end: '10:00', status: 'planned' },
    { id: 'cancelled', title: 'отменённое', start: '11:00', end: '12:00', status: 'cancelled' },
  ],
};

describe('sharing the current card as text', () => {
  it('includes ordered active events, end times and notes', () => {
    const text = scheduleAsText(document, 'plan', 'ru');
    expect(text).toContain('рабочий день');
    expect(text).toContain('14 октября 2026');
    expect(text).toContain('09:00 - 10:00  подготовка');
    expect(text).toContain('12:00 - 13:00  встреча (перенесено)');
    expect(text).toContain('секретная заметка');
    expect(text).not.toContain('отменённое');
    expect(text.indexOf('подготовка')).toBeLessThan(text.indexOf('встреча'));
  });

  it('excludes all names and notes from availability text', () => {
    const text = scheduleAsText(document, 'availability', 'ru');
    expect(text).toContain('10:00 - 12:00  свободно');
    expect(text).not.toMatch(/подготовка|встреча|секретная|отменённое/);
  });

  it('handles an empty day without claiming free time outside event bounds', () => {
    expect(scheduleAsText({ ...document, label: '', lessons: [] }, 'availability', 'ru')).toContain('нет событий');
  });
});

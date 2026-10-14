import { describe, expect, it } from 'vitest';
import { resolveLanguage, t, formatDuration, pluralWord, translations } from './i18n';
import { scheduleAsText } from './share';

describe('language selection and localized output', () => {
  it('uses an explicit supported link before saved and browser preferences', () => {
    expect(resolveLanguage('?lang=ru&other=1', 'en', ['en-US'])).toBe('ru');
    expect(resolveLanguage('?lang=fr', 'ru', ['en-US'])).toBe('ru');
  });
  it('matches browser preferences in order and falls back to english', () => {
    expect(resolveLanguage('', null, ['fr-FR', 'ru-RU', 'en'])).toBe('ru');
    expect(resolveLanguage('', null, ['en-GB', 'ru'])).toBe('en');
    expect(resolveLanguage('', null, ['de'])).toBe('en');
  });
  it('keeps whole sentences, plural rules and durations readable', () => {
    expect(t('план дня', 'en')).toBe('day plan');
    expect(t('план дня', 'ru')).toBe('план дня');
    expect(pluralWord(2, 'event', 'en')).toBe('events');
    expect(pluralWord(5, 'window', 'ru')).toBe('окон');
    expect(formatDuration(90, 'en')).toBe('1 h 30 min');
    expect(formatDuration(90, 'ru')).toBe('1 ч 30 мин');
    expect(Object.values(translations).every(value => value.trim() && !/[—–]/.test(value))).toBe(true);
  });
  it('preserves every interpolation token across the full dictionary', () => {
    const tokens = (value: string) => [...value.matchAll(/\{[^{}]+\}/g)].map(match => match[0]).sort();
    for (const [source, translated] of Object.entries(translations)) {
      expect(tokens(translated), source).toEqual(tokens(source));
    }
  });
  it('localizes exports while preserving user-entered russian text', () => {
    const document = { version: 2 as const, date: '2026-10-14', label: '', lessons: [
      { id: 'mine', title: 'моя встреча', note: 'свои слова', start: '09:00', end: '10:00', status: 'moved' as const },
    ] };
    const text = scheduleAsText(document, 'plan', 'en');
    expect(text).toContain('day plan');
    expect(text).toContain('моя встреча (rescheduled)');
    expect(text).toContain('свои слова');
    expect(text).not.toContain('перенесено');
  });
});

import { t, dateLocale, getLanguage, type Language } from './i18n';
import { activeLessons, availabilityBlocks, sortLessons, type ScheduleDocument } from './schedule';

export const scheduleAsText = (document: ScheduleDocument, mode: 'plan' | 'availability', locale: Language = getLanguage()) => {
  const date = new Intl.DateTimeFormat(dateLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(document.date + 'T12:00:00'));
  const heading = document.label.trim() || (mode === 'plan' ? t('план дня', locale) : t('свободное время', locale));
  const rows = mode === 'availability'
    ? availabilityBlocks(document.lessons).map((block) => `${block.start} - ${block.end}  ${block.kind === 'free' ? t('свободно', locale) : t('занято', locale)}`)
    : sortLessons(activeLessons(document.lessons)).map((lesson) =>
      `${lesson.start} - ${lesson.end}  ${lesson.title || t('событие', locale)}${lesson.status === 'moved' ? ' (' + t('перенесено', locale) + ')' : ''}${lesson.note ? '\n' + lesson.note : ''}`);
  return [heading, date, '', ...(rows.length ? rows : [t('нет событий', locale)])].join('\n');
};

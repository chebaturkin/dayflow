import { activeLessons, availabilityBlocks, sortLessons, type ScheduleDocument } from './schedule';

export const scheduleAsText = (document: ScheduleDocument, mode: 'plan' | 'availability') => {
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(document.date + 'T12:00:00'));
  const heading = document.label.trim() || (mode === 'plan' ? 'план дня' : 'свободное время');
  const rows = mode === 'availability'
    ? availabilityBlocks(document.lessons).map((block) => `${block.start} - ${block.end}  ${block.kind === 'free' ? 'свободно' : 'занято'}`)
    : sortLessons(activeLessons(document.lessons)).map((lesson) =>
      `${lesson.start} - ${lesson.end}  ${lesson.title || 'событие'}${lesson.status === 'moved' ? ' (перенесено)' : ''}${lesson.note ? '\n' + lesson.note : ''}`);
  return [heading, date, '', ...(rows.length ? rows : ['нет событий'])].join('\n');
};

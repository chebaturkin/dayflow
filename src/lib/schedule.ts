export type LessonStatus = 'planned' | 'moved' | 'cancelled';

export type Lesson = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: LessonStatus;
};

export type DaySchedule = { date: string; lessons: Lesson[] };

export const sortLessons = (lessons: Lesson[]) => [...lessons].sort((a, b) => a.start.localeCompare(b.start));

export const activeLessons = (lessons: Lesson[]) => lessons.filter((lesson) => lesson.status !== 'cancelled');

export const durationMinutes = (lesson: Lesson) => {
  const [startHour, startMinute] = lesson.start.split(':').map(Number);
  const [endHour, endMinute] = lesson.end.split(':').map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
};

export const validateSchedule = (schedule: DaySchedule) => {
  const ids = new Set(schedule.lessons.map((lesson) => lesson.id));
  if (ids.size !== schedule.lessons.length) throw new Error('lesson ids must be unique');
  schedule.lessons.forEach((lesson) => {
    if (!lesson.title.trim() || durationMinutes(lesson) <= 0) throw new Error('lesson must have a title and positive duration');
  });
  return schedule;
};

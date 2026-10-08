export type LessonStatus = 'planned' | 'moved' | 'cancelled';

export type Lesson = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: LessonStatus;
  note?: string;
};

export type DaySchedule = { date: string; lessons: Lesson[] };
export type ScheduleDocument = { version: 2; date: string; label: string; lessons: Lesson[] };

export type FreeWindow = {
  start: string;
  end: string;
  minutes: number;
};

export type Conflict = {
  firstId: string;
  secondId: string;
  start: string;
  end: string;
};

export type ScheduleSummary = {
  activeCount: number;
  totalMinutes: number;
  firstStart: string;
  lastEnd: string;
  freeWindows: FreeWindow[];
  conflicts: Conflict[];
};

export const sortLessons = (lessons: Lesson[]) => [...lessons].sort((a, b) => a.start.localeCompare(b.start));

export const activeLessons = (lessons: Lesson[]) => lessons.filter((lesson) => lesson.status !== 'cancelled');

export const durationMinutes = (lesson: Lesson) => {
  const [startHour, startMinute] = lesson.start.split(':').map(Number);
  const [endHour, endMinute] = lesson.end.split(':').map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
};

const timeToMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};

const minutesToTime = (value: number) => {
  const hour = Math.floor(value / 60).toString().padStart(2, '0');
  const minute = (value % 60).toString().padStart(2, '0');
  return hour + ':' + minute;
};

const mergedActiveIntervals = (lessons: Lesson[]) => {
  const intervals: Array<{ start: number; end: number }> = [];
  sortLessons(activeLessons(lessons)).forEach((lesson) => {
    const start = timeToMinutes(lesson.start);
    const end = timeToMinutes(lesson.end);
    const previous = intervals.at(-1);
    if (previous && start <= previous.end) {
      previous.end = Math.max(previous.end, end);
    } else {
      intervals.push({ start, end });
    }
  });
  return intervals;
};

export const freeWindows = (lessons: Lesson[], minimumMinutes = 30): FreeWindow[] => {
  const intervals = mergedActiveIntervals(lessons);
  const windows: FreeWindow[] = [];

  for (let index = 1; index < intervals.length; index += 1) {
    const previousEnd = intervals[index - 1].end;
    const nextStart = intervals[index].start;
    const minutes = nextStart - previousEnd;
    if (minutes >= minimumMinutes) {
      windows.push({ start: minutesToTime(previousEnd), end: minutesToTime(nextStart), minutes });
    }
  }

  return windows;
};

export const conflicts = (lessons: Lesson[]): Conflict[] => {
  const active = sortLessons(activeLessons(lessons));
  const result: Conflict[] = [];

  for (let firstIndex = 0; firstIndex < active.length - 1; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < active.length; secondIndex += 1) {
      const first = active[firstIndex];
      const second = active[secondIndex];
      const overlapStart = Math.max(timeToMinutes(first.start), timeToMinutes(second.start));
      const overlapEnd = Math.min(timeToMinutes(first.end), timeToMinutes(second.end));
      if (overlapStart < overlapEnd) {
        result.push({
          firstId: first.id,
          secondId: second.id,
          start: minutesToTime(overlapStart),
          end: minutesToTime(overlapEnd),
        });
      }
    }
  }

  return result;
};

export const summarizeSchedule = (lessons: Lesson[]): ScheduleSummary => {
  const active = sortLessons(activeLessons(lessons));
  return {
    activeCount: active.length,
    totalMinutes: active.reduce((total, lesson) => total + Math.max(0, durationMinutes(lesson)), 0),
    firstStart: active[0]?.start || '',
    lastEnd: active.at(-1)?.end || '',
    freeWindows: freeWindows(active),
    conflicts: conflicts(active),
  };
};

export const validateSchedule = (schedule: DaySchedule) => {
  const ids = new Set(schedule.lessons.map((lesson) => lesson.id));
  if (ids.size !== schedule.lessons.length) throw new Error('lesson ids must be unique');
  schedule.lessons.forEach((lesson) => {
    if (!lesson.title.trim() || durationMinutes(lesson) <= 0) throw new Error('lesson must have a title and positive duration');
  });
  return schedule;
};

import { t, dateLocale, getLanguage, formatDuration, pluralWord, type Language } from './i18n';
import { activeLessons, availabilityBlocks, sortLessons, summarizeSchedule, type ScheduleDocument } from './schedule';

export const renderPng = (document: ScheduleDocument, style: string, mode: 'plan' | 'availability', signature: boolean, locale: Language = getLanguage()): Promise<Blob> => {
  const canvas = window.document.createElement('canvas');
  canvas.width = 1600;
  let ctx = canvas.getContext('2d')!;
  const palettes = {
    clean: { paper: '#fffefa', ink: '#292c25', muted: '#6a6e61', line: '#dedfd5', accent: '#a95135', soft: '#f7eee5' },
    dark: { paper: '#292e25', ink: '#f1f0e8', muted: '#b3b9aa', line: '#42483c', accent: '#e8a27f', soft: '#34352a' },
  };
  const colors = style === 'dark' ? palettes.dark : palettes.clean;
  const bodyFont = '500 50px "Avenir Next", "Segoe UI", sans-serif';
  const noteFont = '400 28px "Avenir Next", "Segoe UI", sans-serif';
  const headingFont = '400 88px Georgia, serif';
  const wrap = (value: string, font: string, width: number) => {
    ctx.font = font;
    const lines: string[] = [];
    for (const paragraph of value.split(/\r?\n/)) {
      let line = '';
      for (const word of paragraph.trim().split(/\s+/)) {
        const candidate = line ? line + ' ' + word : word;
        if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
        if (line) lines.push(line);
        line = '';
        for (const character of Array.from(word)) {
          if (line && ctx.measureText(line + character).width > width) { lines.push(line); line = ''; }
          line += character;
        }
      }
      lines.push(line);
    }
    return lines;
  };
  const derived = summarizeSchedule(document.lessons);
  const events = sortLessons(activeLessons(document.lessons));
  const heading = wrap(document.label.trim() || (mode === 'plan' ? t('план дня', locale) : t('свободное время', locale)), headingFont, 1360);
  const rows = events.map((lesson) => {
    const title = wrap(lesson.title || t('событие', locale), bodyFont, 1090);
    const note = lesson.note ? wrap(lesson.note, noteFont, 1090) : [];
    const height = Math.max(160, title.length * 62 + note.length * 38 + (lesson.status === 'moved' ? 46 : 0) + 56);
    return { lesson, title, note, height };
  });
  const blocks = availabilityBlocks(document.lessons);
  const summaryY = 280 + (heading.length - 1) * 100;
  const contentY = summaryY + 120;
  const contentHeight = mode === 'plan'
    ? rows.reduce((total, row) => total + row.height, 0)
    : blocks.length * 150;
  const footerY = contentY + Math.max(contentHeight, 120) + 70;
  canvas.height = Math.max(900, footerY + (signature ? 100 : 0));
  ctx = canvas.getContext('2d')!;
  const draw = (text: string, x: number, y: number, font: string, color: string) => {
    ctx.font = font; ctx.fillStyle = color; ctx.fillText(text, x, y);
  };
  const rule = (y: number) => {
    ctx.strokeStyle = colors.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(1480, y); ctx.stroke();
  };
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (style === 'lines') {
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 72) {
      ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(1520, y); ctx.stroke();
    }
  }
  const date = new Intl.DateTimeFormat(dateLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(document.date + 'T12:00:00'));
  draw(date, 120, 115, noteFont, colors.muted);
  heading.forEach((line, index) => draw(line, 120, 225 + index * 100, headingFont, colors.ink));
  const duration = formatDuration(derived.totalMinutes, locale);
  const windows = derived.freeWindows.length;
  const freeLabel = locale === 'en' ? windows + ' free ' + pluralWord(windows, 'window', locale) : t('свободно', locale) + ' ' + windows + ' ' + pluralWord(windows, 'window', locale);
  draw(t('занято', locale) + ' ' + duration + ' · ' + freeLabel, 120, summaryY + 15, noteFont, colors.muted);
  let y = contentY;
  if (!events.length) draw(t('нет событий', locale), 120, y, bodyFont, colors.muted);
  else if (mode === 'plan') {
    rows.forEach(({ lesson, title, note, height }) => {
      rule(y - 45);
      draw(lesson.start, 120, y + 8, '400 36px monospace', colors.accent);
      draw(lesson.end, 120, y + 53, '400 30px monospace', colors.muted);
      title.forEach((line, index) => draw(line, 390, y + 12 + index * 62, bodyFont, colors.ink));
      let detailY = y + title.length * 62;
      note.forEach((line) => { draw(line, 390, detailY, noteFont, colors.muted); detailY += 38; });
      if (lesson.status === 'moved') draw(t('перенесено', locale), 390, detailY + 8, noteFont, colors.accent);
      y += height;
    });
  } else {
    blocks.forEach((block) => {
      if (block.kind === 'free') { ctx.fillStyle = colors.soft; ctx.fillRect(95, y - 45, 1410, 135); }
      rule(y - 45);
      draw(block.start, 120, y + 8, '400 36px monospace', colors.accent);
      draw(block.end, 120, y + 53, '400 30px monospace', colors.muted);
      draw(block.kind === 'free' ? t('свободно', locale) : t('занято', locale), 390, y + 12, bodyFont, block.kind === 'free' ? colors.accent : colors.muted);
      y += 150;
    });
  }
  if (signature) { rule(footerY - 45); draw('dayflow', 120, footerY, noteFont, colors.muted); }
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(t('не получилось создать картинку', locale))), 'image/png'));
};

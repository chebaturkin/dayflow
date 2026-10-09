import { describe, expect, it } from 'vitest';
import { DocumentParseError, parseDocument, serializeDocument } from './document';

const document = {
  version: 2 as const,
  date: '2026-10-06',
  label: 'студия',
  lessons: [{ id: 'one', title: 'one', start: '09:00', end: '10:00', status: 'planned' as const }],
};

describe('portable schedule documents', () => {
  it('round trips a versioned document', () => {
    expect(parseDocument(serializeDocument(document))).toEqual(document);
  });

  it('rejects malformed documents', () => {
    expect(() => parseDocument('{"version":1}')).toThrow(DocumentParseError);
    expect(() => parseDocument(JSON.stringify({ ...document, lessons: [{ ...document.lessons[0], id: 'one' }, { ...document.lessons[0], id: 'one' }] }))).toThrow('повторяющиеся');
  });

  it('rejects impossible event times', () => {
    expect(() => parseDocument(JSON.stringify({
      ...document,
      lessons: [{ ...document.lessons[0], start: '25:00' }],
    }))).toThrow(DocumentParseError);
    expect(() => parseDocument(JSON.stringify({
      ...document,
      lessons: [{ ...document.lessons[0], start: '11:00', end: '10:00' }],
    }))).toThrow(DocumentParseError);
  });

  it('rejects documents outside import limits', () => {
    expect(() => parseDocument(JSON.stringify({ ...document, date: '2026-02-31' }))).toThrow(DocumentParseError);
    expect(() => parseDocument(JSON.stringify({
      ...document,
      lessons: [{ ...document.lessons[0], title: 'x'.repeat(241) }],
    }))).toThrow(DocumentParseError);
    expect(() => parseDocument(JSON.stringify({
      ...document,
      lessons: [{ ...document.lessons[0], id: 'event\nuid' }],
    }))).toThrow(DocumentParseError);
    expect(() => parseDocument(JSON.stringify({
      ...document,
      lessons: Array.from({ length: 201 }, (_, index) => ({
        ...document.lessons[0], id: `event-${index}`,
      })),
    }))).toThrow(DocumentParseError);
  });
});

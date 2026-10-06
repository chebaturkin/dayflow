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
});

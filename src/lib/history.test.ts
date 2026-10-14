import { describe, expect, it } from 'vitest';
import { DocumentHistory } from './history';

describe('document history', () => {
  it('undoes and redoes edits without mutating the saved snapshot', () => {
    const history = new DocumentHistory('initial');
    history.record('edited');
    expect(history.undo()).toBe('initial');
    expect(history.redo()).toBe('edited');
    expect(history.redo()).toBeNull();
  });

  it('groups typing and ignores repeated identical documents', () => {
    const history = new DocumentHistory('initial');
    history.record('a', 'field');
    history.record('ab', 'field');
    history.record('ab', 'field');
    expect(history.undo()).toBe('initial');
    expect(history.redo()).toBe('ab');
  });

  it('starts a separate typing group after focus leaves the field', () => {
    const history = new DocumentHistory('initial');
    history.record('a', 'field');
    history.endGroup();
    history.record('ab', 'field');
    expect(history.undo()).toBe('a');
  });

  it('clears redo after a new edit and exposes available actions', () => {
    const history = new DocumentHistory('initial');
    history.record('first');
    history.undo();
    expect(history.canRedo).toBe(true);
    history.record('second');
    expect(history.canRedo).toBe(false);
    expect(history.canUndo).toBe(true);
  });

  it('keeps the last 50 actions', () => {
    const history = new DocumentHistory('0');
    for (let i = 1; i <= 55; i++) history.record(String(i));
    for (let i = 55; i > 5; i--) expect(history.undo()).toBe(String(i - 1));
    expect(history.undo()).toBeNull();
  });
});

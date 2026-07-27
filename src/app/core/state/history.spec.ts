import { describe, expect, it } from 'vitest';
import {
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from './history';

describe('createHistory', () => {
  it('starts with an empty past and future', () => {
    const history = createHistory('a');
    expect(history.past).toEqual([]);
    expect(history.future).toEqual([]);
    expect(history.present).toEqual({ kind: 'init', value: 'a' });
  });
});

describe('pushHistory', () => {
  it('moves the present into the past and clears the future', () => {
    let history = createHistory('a');
    history = pushHistory(history, 'create-task', 'b');
    history = undoHistory(history);
    history = pushHistory(history, 'create-task', 'c');

    expect(history.future).toEqual([]);
    expect(history.present).toEqual({ kind: 'create-task', value: 'c' });
  });

  it('caps the past at HISTORY_LIMIT entries', () => {
    let history = createHistory(0);
    for (let i = 1; i <= HISTORY_LIMIT + 10; i++) {
      history = pushHistory(history, 'create-task', i);
    }

    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.present.value).toBe(HISTORY_LIMIT + 10);
  });
});

describe('undoHistory / redoHistory', () => {
  it('does nothing on an empty past', () => {
    const history = createHistory('a');
    expect(undoHistory(history)).toBe(history);
  });

  it('does nothing on an empty future', () => {
    const history = createHistory('a');
    expect(redoHistory(history)).toBe(history);
  });

  it('round-trips: undo then redo restores the same present by reference', () => {
    let history = createHistory({ v: 'a' });
    const second = { v: 'b' };
    history = pushHistory(history, 'create-task', second);

    const undone = undoHistory(history);
    expect(undone.present.value).toEqual({ v: 'a' });

    const redone = redoHistory(undone);
    expect(redone.present).toBe(history.present);
    expect(redone.present.value).toBe(second);
  });

  it('moves entries between past and future symmetrically', () => {
    let history = createHistory('a');
    history = pushHistory(history, 'create-task', 'b');
    history = pushHistory(history, 'create-task', 'c');

    const undoneOnce = undoHistory(history);
    expect(undoneOnce.present.value).toBe('b');
    expect(undoneOnce.future.map((s) => s.value)).toEqual(['c']);

    const undoneTwice = undoHistory(undoneOnce);
    expect(undoneTwice.present.value).toBe('a');
    expect(undoneTwice.future.map((s) => s.value)).toEqual(['b', 'c']);

    const redoneOnce = redoHistory(undoneTwice);
    expect(redoneOnce.present.value).toBe('b');
  });
});

describe('canUndo / canRedo', () => {
  it('reflect whether past/future have entries', () => {
    let history = createHistory('a');
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);

    history = pushHistory(history, 'create-task', 'b');
    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);

    history = undoHistory(history);
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(true);
  });
});

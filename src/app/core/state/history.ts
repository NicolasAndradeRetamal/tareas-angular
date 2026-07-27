import type { MutationKind } from '../models/mutation';

export interface Snapshot<T> {
  /** Mutation that produced this value; 'init' for the loaded state. */
  readonly kind: MutationKind;
  readonly value: T;
}

export interface History<T> {
  readonly past: readonly Snapshot<T>[];
  readonly present: Snapshot<T>;
  readonly future: readonly Snapshot<T>[];
}

export const HISTORY_LIMIT = 50;

export function createHistory<T>(value: T): History<T> {
  return { past: [], present: { kind: 'init', value }, future: [] };
}

export function pushHistory<T>(history: History<T>, kind: MutationKind, value: T): History<T> {
  const past = [...history.past, history.present].slice(-HISTORY_LIMIT);
  return { past, present: { kind, value }, future: [] };
}

export function undoHistory<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history;
  const present = history.past[history.past.length - 1];
  const past = history.past.slice(0, -1);
  const future = [history.present, ...history.future];
  return { past, present, future };
}

export function redoHistory<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history;
  const present = history.future[0];
  const future = history.future.slice(1);
  const past = [...history.past, history.present];
  return { past, present, future };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}

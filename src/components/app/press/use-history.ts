import { useCallback, useRef, useState } from 'react';

// A drop-in replacement for useState that records history so the value can be
// undone / redone. The setter keeps useState's signature (a next value or an
// updater function), so existing call sites don't change. History is bounded to
// avoid unbounded memory growth on long editing sessions.
export interface History { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; clear: () => void; }

const LIMIT = 100;

export function useHistory<T>(init: T | (() => T)): [T, (next: T | ((prev: T) => T)) => void, History] {
  const [state, setState] = useState<T>(init);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  // Force re-render when only the can-undo/can-redo flags change.
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((n) => n + 1), []);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      if (Object.is(value, prev)) return prev; // no-op: don't pollute history
      past.current.push(prev);
      if (past.current.length > LIMIT) past.current.shift();
      future.current = [];
      rerender();
      return value;
    });
  }, [rerender]);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    setState((prev) => {
      const previous = past.current.pop() as T;
      future.current.push(prev);
      rerender();
      return previous;
    });
  }, [rerender]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    setState((prev) => {
      const next = future.current.pop() as T;
      past.current.push(prev);
      rerender();
      return next;
    });
  }, [rerender]);

  // Drop the undo/redo stacks without touching the current value (e.g. after
  // loading a fresh workflow, so you can't undo back into the previous doc).
  const clear = useCallback(() => {
    past.current = [];
    future.current = [];
    rerender();
  }, [rerender]);

  const history: History = { undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0, clear };
  return [state, set, history];
}

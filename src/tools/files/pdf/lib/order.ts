/** Page order and selection helpers for page grids (pure, unit-tested). */

/** Move an item in an array (returns a new array). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Move every selected item one place back (-1) or forward (+1), keeping a
 * selected block together; items already at the edge stay. Returns the same
 * array when nothing can move.
 */
export function shiftSelected<T extends { key: string }>(list: readonly T[], selected: ReadonlySet<string>, dir: -1 | 1): readonly T[] {
  const next = list.slice();
  let moved = false;
  const order = dir < 0 ? next.map((_, i) => i) : next.map((_, i) => next.length - 1 - i);
  for (const i of order) {
    const j = i + dir;
    if (!selected.has(next[i].key) || j < 0 || j >= next.length || selected.has(next[j].key)) continue;
    [next[i], next[j]] = [next[j], next[i]];
    moved = true;
  }
  return moved ? next : list;
}

/** Selection with Shift+click ranges over an ordered list of keys. */
export function toggleSelection(prev: ReadonlySet<string>, keys: readonly string[], key: string, extend: boolean, anchor: { current: string | null }): Set<string> {
  const next = new Set(prev);
  if (extend && anchor.current && keys.includes(anchor.current)) {
    const a = keys.indexOf(anchor.current);
    const b = keys.indexOf(key);
    const [lo, hi] = a < b ? [a, b] : [b, a];
    for (let i = lo; i <= hi; i++) next.add(keys[i]);
  } else if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  anchor.current = key;
  return next;
}

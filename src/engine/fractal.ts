import type { Fractal, MergedBar } from './types.ts';

/**
 * Strict fractals on merged bars.
 * A top needs both a higher high and a higher low than each neighbor.
 * Equality does not count, so a bar cannot be both a top and a bottom.
 */
export function findFractals(merged: readonly MergedBar[]): Fractal[] {
  const found: Fractal[] = [];
  for (let i = 1; i < merged.length - 1; i += 1) {
    const left = merged[i - 1];
    const mid = merged[i];
    const right = merged[i + 1];
    const top = mid.high > left.high && mid.high > right.high && mid.low > left.low && mid.low > right.low;
    const bottom = mid.low < left.low && mid.low < right.low && mid.high < left.high && mid.high < right.high;
    if (top) {
      found.push({
        type: 'top',
        index: i,
        time: mid.time,
        endTime: mid.endTime,
        high: mid.high,
        low: mid.low,
        extreme: mid.high,
      });
    } else if (bottom) {
      found.push({
        type: 'bottom',
        index: i,
        time: mid.time,
        endTime: mid.endTime,
        high: mid.high,
        low: mid.low,
        extreme: mid.low,
      });
    }
  }
  return found;
}

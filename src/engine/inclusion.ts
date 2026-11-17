import type { Bar, Direction, MergedBar } from './types.ts';

export function rangesInclude(
  a: { high: number; low: number },
  b: { high: number; low: number },
): boolean {
  const aHoldsB = a.high >= b.high && a.low <= b.low;
  const bHoldsA = b.high >= a.high && b.low <= a.low;
  return aHoldsB || bHoldsA;
}

/**
 * Direction used when two ranges are merged.
 * Equal highs fall through to the lows. Equal highs and equal lows are treated as down.
 */
export function resolveDirection(
  prev: { high: number; low: number },
  next: { high: number; low: number },
): Direction {
  if (next.high > prev.high) return 'up';
  if (next.high < prev.high) return 'down';
  if (next.low > prev.low) return 'up';
  return 'down';
}

function toMerged(bar: Bar, index: number): MergedBar {
  return {
    time: bar.time,
    endTime: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    startIndex: index,
    endIndex: index,
    direction: 'flat',
    rawCount: 1,
  };
}

function combine(existing: MergedBar, incoming: MergedBar, direction: Direction): MergedBar {
  const up = direction === 'up';
  return {
    time: existing.time,
    endTime: incoming.endTime,
    open: existing.open,
    close: incoming.close,
    high: up ? Math.max(existing.high, incoming.high) : Math.min(existing.high, incoming.high),
    low: up ? Math.max(existing.low, incoming.low) : Math.min(existing.low, incoming.low),
    startIndex: existing.startIndex,
    endIndex: incoming.endIndex,
    direction: existing.direction,
    rawCount: existing.rawCount + incoming.rawCount,
  };
}

/**
 * Forward inclusion pass (包含处理).
 * When the merged list already has two bars, direction comes from those two.
 * When it has one, direction comes from that bar and the incoming bar.
 */
export function mergeInclusion(bars: readonly Bar[]): MergedBar[] {
  const merged: MergedBar[] = [];
  for (let i = 0; i < bars.length; i += 1) {
    const incoming = toMerged(bars[i], i);
    if (merged.length === 0) {
      merged.push(incoming);
      continue;
    }
    const last = merged[merged.length - 1];
    if (!rangesInclude(last, incoming)) {
      merged.push(incoming);
      continue;
    }
    const direction =
      merged.length >= 2 ? resolveDirection(merged[merged.length - 2], last) : resolveDirection(last, incoming);
    merged[merged.length - 1] = combine(last, incoming, direction);
  }
  if (merged.length > 0) merged[0].direction = 'flat';
  for (let i = 1; i < merged.length; i += 1) {
    merged[i].direction = resolveDirection(merged[i - 1], merged[i]);
  }
  return merged;
}

import { rangesInclude, resolveDirection } from './inclusion.ts';
import type { Bi, Direction, Segment } from './types.ts';

interface Eigen {
  high: number;
  low: number;
  /** Index of the counter-trend stroke this element stands for. */
  biIndex: number;
}

function mergeEigen(existing: Eigen, incoming: Eigen, direction: Direction): Eigen {
  if (direction === 'up') {
    return {
      high: Math.max(existing.high, incoming.high),
      low: Math.max(existing.low, incoming.low),
      biIndex: existing.high >= incoming.high ? existing.biIndex : incoming.biIndex,
    };
  }
  return {
    high: Math.min(existing.high, incoming.high),
    low: Math.min(existing.low, incoming.low),
    biIndex: existing.low <= incoming.low ? existing.biIndex : incoming.biIndex,
  };
}

function pushEigen(merged: Eigen[], incoming: Eigen): void {
  if (merged.length === 0) {
    merged.push(incoming);
    return;
  }
  const last = merged[merged.length - 1];
  if (!rangesInclude(last, incoming)) {
    merged.push(incoming);
    return;
  }
  const direction =
    merged.length >= 2 ? resolveDirection(merged[merged.length - 2], last) : resolveDirection(last, incoming);
  merged[merged.length - 1] = mergeEigen(last, incoming, direction);
}

function isTop(a: Eigen, b: Eigen, c: Eigen): boolean {
  return b.high > a.high && b.high > c.high && b.low > a.low && b.low > c.low;
}

function isBottom(a: Eigen, b: Eigen, c: Eigen): boolean {
  return b.low < a.low && b.low < c.low && b.high < a.high && b.high < c.high;
}

/**
 * Gap between the first and second element of a feature-sequence fractal.
 * Up segment: the second element sits entirely above the first.
 * Down segment: the second element sits entirely below the first.
 * A gapped fractal does not end the segment.
 */
function hasGap(first: Eigen, second: Eigen, segmentDir: Direction): boolean {
  if (segmentDir === 'up') return second.low > first.high;
  return second.high < first.low;
}

/**
 * End index of a segment that starts at `start`, or null if no feature-sequence
 * fractal has confirmed an ending yet.
 * The returned index is the with-trend stroke just before the middle eigen element.
 */
export function findSegmentEnd(strokes: readonly Bi[], start: number): number | null {
  const direction = strokes[start]?.direction;
  if (!direction) return null;
  const merged: Eigen[] = [];
  for (let j = start + 1; j < strokes.length; j += 1) {
    if (strokes[j].direction === direction) continue;
    pushEigen(merged, { high: strokes[j].high, low: strokes[j].low, biIndex: j });
    if (merged.length < 3) continue;
    const left = merged[merged.length - 3];
    const mid = merged[merged.length - 2];
    const right = merged[merged.length - 1];
    const fractal = direction === 'up' ? isTop(left, mid, right) : isBottom(left, mid, right);
    if (!fractal || hasGap(left, mid, direction)) continue;
    const endBi = mid.biIndex - 1;
    if (endBi >= start + 2 && endBi < strokes.length && strokes[endBi].direction === direction) return endBi;
  }
  return null;
}

function makeSegment(strokes: readonly Bi[], start: number, end: number, finished: boolean, ordinal: number): Segment {
  const members = strokes.slice(start, end + 1);
  let high = -Infinity;
  let low = Infinity;
  for (const stroke of members) {
    high = Math.max(high, stroke.high);
    low = Math.min(low, stroke.low);
  }
  const first = strokes[start];
  const last = strokes[end];
  return {
    id: `seg-${ordinal}`,
    direction: first.direction,
    startBi: start,
    endBi: end,
    startTime: first.startTime,
    endTime: last.endTime,
    startPrice: first.startPrice,
    endPrice: last.endPrice,
    high,
    low,
    finished,
    biIds: members.map((stroke) => stroke.id),
  };
}

/**
 * Segments (线段) by feature-sequence fractals.
 * The first segment takes the direction of the first stroke. That is a reading
 * choice: a chart can open in the middle of a larger move.
 * An unfinished tail is kept when at least three strokes remain and no fractal has ended them.
 */
export function buildSegments(strokes: readonly Bi[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  let ordinal = 1;
  while (cursor < strokes.length) {
    if (cursor + 2 >= strokes.length) break;
    const end = findSegmentEnd(strokes, cursor);
    if (end === null) {
      let endBi = strokes.length - 1;
      if (strokes[endBi].direction !== strokes[cursor].direction) endBi -= 1;
      if (endBi >= cursor + 2) segments.push(makeSegment(strokes, cursor, endBi, false, ordinal));
      break;
    }
    segments.push(makeSegment(strokes, cursor, end, true, ordinal));
    ordinal += 1;
    const next = end + 1;
    if (next <= cursor) break;
    cursor = next;
  }
  return segments;
}

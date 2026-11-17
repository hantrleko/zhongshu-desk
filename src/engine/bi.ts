import type { Bi, Fractal, MergedBar } from './types.ts';

/**
 * Center-to-center distance on merged bars.
 * 4 means at least one merged bar between the two 3-bar fractals belongs to neither.
 */
export const BI_MIN_CENTER_DISTANCE = 4;

function moreExtreme(current: Fractal, candidate: Fractal): boolean {
  if (current.type !== candidate.type) return false;
  if (current.type === 'top') return candidate.extreme > current.extreme;
  return candidate.extreme < current.extreme;
}

function uniqueExtreme(
  merged: readonly MergedBar[],
  from: number,
  to: number,
): { maxHigh: number; maxHighCount: number; minLow: number; minLowCount: number } {
  let maxHigh = -Infinity;
  let minLow = Infinity;
  let maxHighCount = 0;
  let minLowCount = 0;
  for (let i = from; i <= to; i += 1) {
    const high = merged[i].high;
    const low = merged[i].low;
    if (high > maxHigh) {
      maxHigh = high;
      maxHighCount = 1;
    } else if (high === maxHigh) {
      maxHighCount += 1;
    }
    if (low < minLow) {
      minLow = low;
      minLowCount = 1;
    } else if (low === minLow) {
      minLowCount += 1;
    }
  }
  return { maxHigh, maxHighCount, minLow, minLowCount };
}

/** A bi is valid only when its two fractals are the unique extremes of the span between them. */
export function canFormBi(start: Fractal, end: Fractal, merged: readonly MergedBar[]): boolean {
  if (start.type === end.type) return false;
  if (end.index - start.index < BI_MIN_CENTER_DISTANCE) return false;
  if (start.index < 0 || end.index >= merged.length) return false;
  const span = uniqueExtreme(merged, start.index, end.index);
  if (start.type === 'bottom' && end.type === 'top') {
    return (
      end.high === span.maxHigh &&
      span.maxHighCount === 1 &&
      start.low === span.minLow &&
      span.minLowCount === 1 &&
      end.high > start.high
    );
  }
  if (start.type === 'top' && end.type === 'bottom') {
    return (
      start.high === span.maxHigh &&
      span.maxHighCount === 1 &&
      end.low === span.minLow &&
      span.minLowCount === 1 &&
      end.low < start.low
    );
  }
  return false;
}

function toBi(start: Fractal, end: Fractal, ordinal: number): Bi {
  const up = start.type === 'bottom' && end.type === 'top';
  const startPrice = up ? start.low : start.high;
  const endPrice = up ? end.high : end.low;
  return {
    id: `bi-${ordinal}`,
    direction: up ? 'up' : 'down',
    startIndex: start.index,
    endIndex: end.index,
    startTime: start.time,
    endTime: end.time,
    startPrice,
    endPrice,
    high: Math.max(startPrice, endPrice),
    low: Math.min(startPrice, endPrice),
  };
}

/**
 * Strokes from an alternating fractal list.
 * A later fractal of the same type replaces the endpoint when it is more extreme
 * and still makes a valid stroke with the previous endpoint.
 */
export function buildBi(fractals: readonly Fractal[], merged: readonly MergedBar[]): Bi[] {
  const endpoints: Fractal[] = [];
  for (const fractal of fractals) {
    if (endpoints.length === 0) {
      endpoints.push(fractal);
      continue;
    }
    const last = endpoints[endpoints.length - 1];
    if (fractal.type === last.type) {
      const canReplace = endpoints.length === 1 || canFormBi(endpoints[endpoints.length - 2], fractal, merged);
      if (moreExtreme(last, fractal) && canReplace) endpoints[endpoints.length - 1] = fractal;
      continue;
    }
    if (canFormBi(last, fractal, merged)) endpoints.push(fractal);
  }
  const strokes: Bi[] = [];
  for (let i = 1; i < endpoints.length; i += 1) {
    strokes.push(toBi(endpoints[i - 1], endpoints[i], i));
  }
  return strokes;
}

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

/**
 * Same-type comparison that also accepts an equal extreme.
 * Tied endpoints resolve to the later fractal, so a still-forming stroke
 * extends to the most recent equal high or low.
 */
function atLeastAsExtreme(current: Fractal, candidate: Fractal): boolean {
  if (current.type !== candidate.type) return false;
  if (current.type === 'top') return candidate.extreme >= current.extreme;
  return candidate.extreme <= current.extreme;
}

/** Highest high and lowest low inside a merged-bar span. Ties are allowed. */
function spanExtremes(
  merged: readonly MergedBar[],
  from: number,
  to: number,
): { maxHigh: number; minLow: number } {
  let maxHigh = -Infinity;
  let minLow = Infinity;
  for (let i = from; i <= to; i += 1) {
    maxHigh = Math.max(maxHigh, merged[i].high);
    minLow = Math.min(minLow, merged[i].low);
  }
  return { maxHigh, minLow };
}

/**
 * A bi is valid when each endpoint matches an extreme of the span between them.
 * The endpoint only has to equal the span extreme; other bars may tie it.
 * No bar in the span may be more extreme than the endpoint it belongs to.
 */
export function canFormBi(start: Fractal, end: Fractal, merged: readonly MergedBar[]): boolean {
  if (start.type === end.type) return false;
  if (end.index - start.index < BI_MIN_CENTER_DISTANCE) return false;
  if (start.index < 0 || end.index >= merged.length) return false;
  const span = spanExtremes(merged, start.index, end.index);
  if (start.type === 'bottom' && end.type === 'top') {
    return end.high === span.maxHigh && start.low === span.minLow && end.high > start.high;
  }
  if (start.type === 'top' && end.type === 'bottom') {
    return start.high === span.maxHigh && end.low === span.minLow && end.low < start.low;
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
 * Recovery variant: the start must still be the extreme of the whole span,
 * but the end only has to lead the span after the minimum center distance.
 * This keeps a stroke alive when an early counter move was too short to
 * become a stroke of its own.
 */
function canRecoverBi(start: Fractal, end: Fractal, merged: readonly MergedBar[]): boolean {
  if (start.type === end.type) return false;
  if (end.index - start.index <= BI_MIN_CENTER_DISTANCE) return false;
  if (start.index < 0 || end.index >= merged.length) return false;
  const fullSpan = spanExtremes(merged, start.index, end.index);
  const tailSpan = spanExtremes(merged, start.index + BI_MIN_CENTER_DISTANCE, end.index);
  if (start.type === 'bottom' && end.type === 'top') {
    return start.low === fullSpan.minLow && end.high === tailSpan.maxHigh && end.high > start.high;
  }
  if (start.type === 'top' && end.type === 'bottom') {
    return start.high === fullSpan.maxHigh && end.low === tailSpan.minLow && end.low < start.low;
  }
  return false;
}

/**
 * Whether an endpoint can never anchor another stroke.
 *
 * A bottom endpoint dies once a merged bar after it dips below its low; a top
 * endpoint dies once a merged bar after it rises above its high. Every future
 * stroke span contains that bar, so the endpoint can no longer be the span
 * extreme that `canFormBi` and `canRecoverBi` both require.
 */
function isDeadEndpoint(endpoint: Fractal, uptoIndex: number, merged: readonly MergedBar[]): boolean {
  if (uptoIndex <= endpoint.index) return false;
  if (endpoint.type === 'bottom') {
    for (let i = endpoint.index + 1; i <= uptoIndex; i += 1) {
      if (merged[i].low < endpoint.low) return true;
    }
    return false;
  }
  for (let i = endpoint.index + 1; i <= uptoIndex; i += 1) {
    if (merged[i].high > endpoint.high) return true;
  }
  return false;
}

/**
 * Strokes from an alternating fractal list.
 *
 * A later fractal of the same type replaces the endpoint when it is at least as
 * extreme (ties go to the later fractal) and still makes a valid stroke with
 * the previous endpoint.
 *
 * Backtracking: when a counter fractal cannot pair but is strictly more
 * extreme than the start of the stroke in progress, that stroke is cancelled
 * and the previous one tries to extend to the new extreme. If the extension
 * is invalid the endpoint is restored, so a still-pairable fractal is never
 * lost to a failed rollback.
 *
 * Dead endpoints: when a counter fractal can neither pair nor trigger
 * backtracking, a tail endpoint that a later bar has already exceeded is
 * dropped and the fractal retried against the new tail. Without this, one
 * poisoned endpoint freezes every later fractal and the series ends up with no
 * structure for its remainder.
 */
export function buildBi(fractals: readonly Fractal[], merged: readonly MergedBar[]): Bi[] {
  const endpoints: Fractal[] = [];
  for (const fractal of fractals) {
    for (;;) {
      if (endpoints.length === 0) {
        endpoints.push(fractal);
        break;
      }
      const last = endpoints[endpoints.length - 1];
      if (fractal.type === last.type) {
        const canReplace = endpoints.length === 1 || canFormBi(endpoints[endpoints.length - 2], fractal, merged);
        if (atLeastAsExtreme(last, fractal) && canReplace) endpoints[endpoints.length - 1] = fractal;
        break;
      }
      // Pair first: a valid stroke always beats restructuring.
      if (canFormBi(last, fractal, merged) || canRecoverBi(last, fractal, merged)) {
        endpoints.push(fractal);
        break;
      }
      const prev = endpoints.length > 1 ? endpoints[endpoints.length - 2] : undefined;
      if (prev && moreExtreme(prev, fractal)) {
        // Backtrack: the counter fractal is more extreme than the start of the
        // stroke in progress, so cancel that stroke and try to extend the
        // previous one to the new extreme instead. When the extension is
        // itself invalid, restore the endpoint — the fractal may still close
        // a valid stroke with it once dead endpoints are cleared.
        const cancelled = endpoints.pop() as Fractal;
        const before = endpoints.length > 1 ? endpoints[endpoints.length - 2] : undefined;
        if (!before || canFormBi(before, fractal, merged)) {
          endpoints[endpoints.length - 1] = fractal;
          break;
        }
        endpoints.push(cancelled);
      }
      if (isDeadEndpoint(last, fractal.index, merged)) {
        endpoints.pop();
        continue;
      }
      break;
    }
  }
  const strokes: Bi[] = [];
  for (let i = 1; i < endpoints.length; i += 1) {
    strokes.push(toBi(endpoints[i - 1], endpoints[i], i));
  }
  return strokes;
}

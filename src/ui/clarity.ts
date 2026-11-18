import { isIntraday, type Timeframe } from '../data/resample.ts';
import { formatBarClock } from '../format.ts';
import type { Bar, HubLevel, Mark } from '../engine/types.ts';

/** Lessons have no minute bars. A requested 5m/15m/30m/1h chip must not stay selected. */
export function resolveShownTimeframe(requested: Timeframe, isLive: boolean): Timeframe {
  if (!isLive && isIntraday(requested)) return 'D';
  return requested;
}

export function intradayChipsEnabled(isLive: boolean): boolean {
  return isLive;
}

/** Last bar stamp from a real bar. Returns null when there is no bar; never uses the clock. */
export function lastBarClock(bar: Bar | undefined, shownTimeframe: Timeframe): string | null {
  if (!bar || !Number.isFinite(bar.time)) return null;
  return formatBarClock(bar.time, isIntraday(shownTimeframe));
}

/** Confirmed swings are every item except the last, which can still extend. */
export function partitionLastSwing<T>(items: readonly T[]): { confirmed: T[]; unconfirmed: T[] } {
  if (items.length === 0) return { confirmed: [], unconfirmed: [] };
  return { confirmed: items.slice(0, -1) as T[], unconfirmed: [items[items.length - 1]] as T[] };
}

export function markChartLabel(kind: Mark['kind'], labels: { buy: string; sell: string }): string {
  return kind === 'buy3' ? labels.buy : labels.sell;
}

/** A third-class buy sits at a valley, a sell at a peak. The word is placed beside that extreme. */
export function markAnchor(kind: Mark['kind']): 'above' | 'below' {
  return kind === 'buy3' ? 'below' : 'above';
}

export type EmptyHubReason =
  | { kind: 'need-strokes'; bars: number; strokes: number }
  | { kind: 'weekly-no-structure'; bars: number; strokes: number }
  | { kind: 'need-segments'; segments: number; finished: number };

export function emptyHubReason(input: {
  level: HubLevel;
  barCount: number;
  strokeCount: number;
  segmentCount: number;
  finishedSegments: number;
  timeframe: Timeframe;
}): EmptyHubReason {
  if (input.level === 'segment') {
    return {
      kind: 'need-segments',
      segments: input.segmentCount,
      finished: input.finishedSegments,
    };
  }
  if (input.timeframe === 'W') {
    return { kind: 'weekly-no-structure', bars: input.barCount, strokes: input.strokeCount };
  }
  return { kind: 'need-strokes', bars: input.barCount, strokes: input.strokeCount };
}

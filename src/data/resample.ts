import type { Bar } from '../engine/types.ts';

export type Timeframe = '5m' | '15m' | '30m' | '1h' | 'D' | 'W';

export const TIMEFRAMES: readonly Timeframe[] = ['5m', '15m', '30m', '1h', 'D', 'W'];

/** Lessons are daily. Intraday chips must not invent a finer series. */
export function isIntraday(timeframe: Timeframe): boolean {
  return timeframe !== 'D' && timeframe !== 'W';
}

function finiteVolume(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Monday 00:00 UTC of the week containing `time`. Not an exchange calendar. */
export function weekStart(time: number): number {
  const date = new Date(time * 1000);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - mondayOffset) / 1000;
}

/** Aggregate daily bars into UTC weeks. Open is the first bar, close is the last. */
export function resampleWeekly(bars: readonly Bar[]): Bar[] {
  const groups = new Map<number, Bar>();
  for (const bar of bars) {
    const key = weekStart(bar.time);
    const existing = groups.get(key);
    if (!existing) {
      const next: Bar = { time: key, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
      if (finiteVolume(bar.volume)) next.volume = bar.volume;
      groups.set(key, next);
      continue;
    }
    existing.high = Math.max(existing.high, bar.high);
    existing.low = Math.min(existing.low, bar.low);
    existing.close = bar.close;
    if (finiteVolume(existing.volume) && finiteVolume(bar.volume)) existing.volume = existing.volume + bar.volume;
    else delete existing.volume;
  }
  return [...groups.values()];
}

/**
 * Weekly folds daily bars. Every other chip, including 5m/15m/30m/1h, returns the
 * same OHLC. A daily lesson has no intraday prints, and this function does not create any.
 */
export function applyTimeframe(bars: readonly Bar[], timeframe: Timeframe): Bar[] {
  if (timeframe === 'W') return resampleWeekly(bars);
  return bars.map((bar) => ({ ...bar }));
}

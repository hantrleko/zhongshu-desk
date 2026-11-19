import type { Bar } from '../engine/types.ts';

export interface LinePoint {
  time: number;
  value: number;
}

export interface MacdPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Simple moving average of closes. Starts when `period` real closes exist. */
export function computeSma(bars: readonly Pick<Bar, 'time' | 'close'>[], period: number): LinePoint[] {
  if (period < 1) return [];
  const points: LinePoint[] = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i += 1) {
    const close = bars[i].close;
    if (!finite(close)) return points;
    sum += close;
    if (i >= period) sum -= bars[i - period].close;
    if (i >= period - 1) points.push({ time: bars[i].time, value: sum / period });
  }
  return points;
}

function emaSeed(values: readonly number[], period: number): number[] | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i += 1) ema += values[i];
  ema /= period;
  const out: number[] = new Array(values.length);
  for (let i = 0; i < period - 1; i += 1) out[i] = Number.NaN;
  out[period - 1] = ema;
  for (let i = period; i < values.length; i += 1) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

/**
 * MACD(12,26,9) from closes. Fast and slow EMAs are seeded with an SMA.
 * Points start when the signal line exists. This is an indicator, not Chanlun.
 */
export function computeMacd(
  bars: readonly Pick<Bar, 'time' | 'close'>[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdPoint[] {
  if (bars.length < slow + signalPeriod - 1) return [];
  const closes = bars.map((bar) => bar.close);
  if (closes.some((value) => !finite(value))) return [];
  const fastEma = emaSeed(closes, fast);
  const slowEma = emaSeed(closes, slow);
  if (!fastEma || !slowEma) return [];
  const macdLine: number[] = [];
  const macdTimes: number[] = [];
  for (let i = 0; i < bars.length; i += 1) {
    if (!Number.isFinite(fastEma[i]) || !Number.isFinite(slowEma[i])) continue;
    macdLine.push(fastEma[i] - slowEma[i]);
    macdTimes.push(bars[i].time);
  }
  const signalEma = emaSeed(macdLine, signalPeriod);
  if (!signalEma) return [];
  const points: MacdPoint[] = [];
  for (let i = 0; i < macdLine.length; i += 1) {
    const signal = signalEma[i];
    if (!Number.isFinite(signal)) continue;
    const macd = macdLine[i];
    points.push({ time: macdTimes[i], macd, signal, histogram: macd - signal });
  }
  return points;
}

export function volumePoints(bars: readonly Bar[]): Array<{ time: number; value: number; up: boolean }> {
  const points: Array<{ time: number; value: number; up: boolean }> = [];
  for (const bar of bars) {
    if (!finite(bar.volume) || bar.volume < 0) continue;
    points.push({ time: bar.time, value: bar.volume, up: bar.close >= bar.open });
  }
  return points;
}

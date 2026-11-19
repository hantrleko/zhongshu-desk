import { computeMacd, computeSma } from '../data/indicators.ts';
import type { Bar, Hub } from '../engine/types.ts';

export type Trend = 'rising' | 'falling' | 'mixed' | 'insufficient';
export interface ReferenceLevel {
  kind: 'rangeHigh' | 'rangeLow' | 'hubHigh' | 'hubLow';
  price: number;
  distance: number;
  from: number;
  to: number;
  provisional: boolean;
}
export interface Research {
  bars: number;
  close?: number;
  time?: number;
  trend: Trend;
  ma20?: number;
  maSlope?: number;
  deviation?: number;
  dif?: number;
  dea?: number;
  histogram?: number;
  volumeRatio?: number;
  rangePosition?: 'above' | 'inside' | 'below';
  range?: { high: number; low: number; from: number; to: number };
  levels: ReferenceLevel[];
}

/** No sorting, filling or truncation: invalid chronology invalidates the reading. */
export function validResearchBars(bars: readonly Bar[]): boolean {
  return bars.length > 0 && bars.every((bar, i) =>
    [bar.time, bar.open, bar.high, bar.low, bar.close].every(Number.isFinite) &&
    bar.low > 0 && bar.high >= Math.max(bar.open, bar.close, bar.low) &&
    bar.low <= Math.min(bar.open, bar.close) && (i === 0 || bar.time > bars[i - 1].time));
}

/** Technical observations only. Window counts refer to bars, never trading days. */
export function buildResearch(bars: readonly Bar[], hub?: Hub, hubProvisional = true): Research {
  const out: Research = { bars: bars.length, trend: 'insufficient', levels: [] };
  if (!validResearchBars(bars)) return { ...out, bars: 0 };
  const last = bars[bars.length - 1];
  out.close = last.close;
  out.time = last.time;
  const ma = computeSma(bars, 20);
  out.ma20 = ma.at(-1)?.value;
  if (out.ma20 !== undefined) out.deviation = (last.close / out.ma20 - 1) * 100;
  if (ma.length >= 2 && out.ma20 !== undefined) {
    out.maSlope = out.ma20 - ma[ma.length - 2].value;
    out.trend = last.close > out.ma20 && out.maSlope > 0 ? 'rising'
      : last.close < out.ma20 && out.maSlope < 0 ? 'falling' : 'mixed';
  }
  const macd = computeMacd(bars).at(-1);
  if (macd) {
    out.dif = macd.macd;
    out.dea = macd.signal;
    out.histogram = macd.histogram;
  }
  // The current bar never contributes to its own comparison window.
  if (bars.length >= 21) {
    const prior = bars.slice(-21, -1);
    const highBar = prior.reduce((a, b) => b.high >= a.high ? b : a);
    const lowBar = prior.reduce((a, b) => b.low <= a.low ? b : a);
    out.range = { high: highBar.high, low: lowBar.low, from: prior[0].time, to: prior[19].time };
    out.rangePosition = last.close > highBar.high ? 'above' : last.close < lowBar.low ? 'below' : 'inside';
    const add = (kind: ReferenceLevel['kind'], price: number, from: number, to: number, provisional: boolean): void => {
      out.levels.push({ kind, price, distance: (price / last.close - 1) * 100, from, to, provisional });
    };
    add('rangeHigh', highBar.high, prior[0].time, prior[19].time, false);
    add('rangeLow', lowBar.low, prior[0].time, prior[19].time, false);
    const volumes = prior.map(bar => bar.volume);
    if (Number.isFinite(last.volume) && (last.volume as number) >= 0 &&
      volumes.every(v => v !== undefined && Number.isFinite(v) && v >= 0)) {
      const mean = (volumes as number[]).reduce((a, b) => a + b, 0) / 20;
      if (mean > 0) out.volumeRatio = (last.volume as number) / mean;
    }
  }
  if (hub && [hub.startTime, hub.endTime, hub.zd, hub.zg].every(Number.isFinite) && hub.startTime <= hub.endTime && hub.endTime <= last.time && hub.zd > 0 && hub.zg > hub.zd) {
    for (const [kind, price] of [['hubHigh', hub.zg], ['hubLow', hub.zd]] as const) {
      out.levels.push({ kind, price, distance: (price / last.close - 1) * 100,
        from: hub.startTime, to: hub.endTime, provisional: hubProvisional });
    }
  }
  out.levels.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance));
  return out;
}

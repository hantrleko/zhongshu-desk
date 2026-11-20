import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze.ts';
import { BI_MIN_CENTER_DISTANCE } from '../src/engine/bi.ts';
import type { Bar, Bi, MergedBar } from '../src/engine/types.ts';
import bars300308 from './fixtures/bars-300308-daily.json';

/** Mid-price series folded into OHLC bars, matching the desk's wick convention. */
function barsFromPrices(prices: readonly number[]): Bar[] {
  const t0 = 1_700_000_000;
  return prices.map((price, i) => ({
    time: t0 + i * 86_400,
    open: price - 0.25,
    high: price + 0.5,
    low: price - 0.5,
    close: price + 0.25,
  }));
}

function spanExtreme(merged: readonly MergedBar[], from: number, to: number, pick: 'high' | 'low'): number {
  let value = pick === 'high' ? -Infinity : Infinity;
  for (let i = from; i <= to; i += 1) {
    value = pick === 'high' ? Math.max(value, merged[i][pick]) : Math.min(value, merged[i][pick]);
  }
  return value;
}

/**
 * Every emitted stroke must keep the engine's extreme guarantees: the start
 * price is the full-span extreme for its side, and the end price leads the
 * span after the minimum center distance (the relaxed recovery rule).
 */
function expectStrokeExtremes(stroke: Bi, merged: readonly MergedBar[]): void {
  const up = stroke.direction === 'up';
  const startPick = up ? 'low' : 'high';
  const endPick = up ? 'high' : 'low';
  expect(stroke.startPrice).toBe(spanExtreme(merged, stroke.startIndex, stroke.endIndex, startPick));
  const tailFrom = Math.min(stroke.startIndex + BI_MIN_CENTER_DISTANCE, stroke.endIndex);
  expect(stroke.endPrice).toBe(spanExtreme(merged, tailFrom, stroke.endIndex, endPick));
}

function expectCleanStrokeList(analysis: ReturnType<typeof analyze>): void {
  for (let i = 0; i < analysis.bi.length; i += 1) {
    const stroke = analysis.bi[i];
    if (i > 0) {
      expect(stroke.direction).not.toBe(analysis.bi[i - 1].direction);
      expect(stroke.startIndex).toBe(analysis.bi[i - 1].endIndex);
    }
    expectStrokeExtremes(stroke, analysis.merged);
  }
}

describe('stroke coverage regressions', () => {
  it('keeps stroking after price dips below the stroke start and then makes a higher high', () => {
    const prices = [
      108, 100, 104, 108, 112, 120, 110, 98, 105, 112, 120, 130, 125, 120, 115, 110, 115, 120, 125, 135,
      128, 120, 112, 105, 112, 120, 128, 140, 130, 120, 110, 100, 108,
    ];
    const analysis = analyze(barsFromPrices(prices));
    expect(analysis.bi.length).toBeGreaterThanOrEqual(4);
    const last = analysis.bi[analysis.bi.length - 1];
    expect(last.endIndex).toBeGreaterThanOrEqual(analysis.merged.length - 3);
    expectCleanStrokeList(analysis);
  });

  it('keeps stroking through equal double tops and bottoms', () => {
    const prices = [
      108, 100, 104, 108, 112, 120, 115, 110, 115, 120, 114, 108, 104, 100, 96, 92, 96, 100, 104, 110,
      104, 98, 94, 90, 96, 102, 108, 114, 108,
    ];
    const analysis = analyze(barsFromPrices(prices));
    expect(analysis.bi.length).toBeGreaterThanOrEqual(4);
    const last = analysis.bi[analysis.bi.length - 1];
    expect(last.endIndex).toBeGreaterThanOrEqual(analysis.merged.length - 3);
    expectCleanStrokeList(analysis);
  });
});

describe('real 300308 daily fixture', () => {
  it('reaches the end of the series instead of stalling mid-chart', () => {
    const analysis = analyze(bars300308.bars);
    // Before the stroke repair this fixture produced 4 strokes ending near
    // merged index 62 of 258; the tail carried no structure at all.
    expect(analysis.bi.length).toBeGreaterThanOrEqual(8);
    const last = analysis.bi[analysis.bi.length - 1];
    expect(last.endIndex).toBeGreaterThanOrEqual(analysis.merged.length - 10);
    expectCleanStrokeList(analysis);
  });
});

describe('random-walk stroke properties', () => {
  function mulberry32(seed: number): () => number {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomWalk(seed: number, n: number): Bar[] {
    const rnd = mulberry32(seed);
    const bars: Bar[] = [];
    let price = 100;
    const t0 = 1_700_000_000;
    for (let i = 0; i < n; i += 1) {
      price *= 1 + (rnd() - 0.5) * 0.06;
      const open = price;
      const close = price * (1 + (rnd() - 0.5) * 0.02);
      const high = Math.max(open, close) * (1 + rnd() * 0.008);
      const low = Math.min(open, close) * (1 - rnd() * 0.008);
      bars.push({ time: t0 + i * 86_400, open, high, low, close });
    }
    return bars;
  }

  it('always alternates, chains endpoints, keeps span extremes, and covers the tail', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const analysis = analyze(randomWalk(seed, 300));
      expectCleanStrokeList(analysis);
      const last = analysis.bi[analysis.bi.length - 1];
      if (last) {
        // No large structurally valid tail may sit behind the final stroke.
        expect(analysis.merged.length - 1 - last.endIndex).toBeLessThanOrEqual(24);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { computeMacd, computeSma, volumePoints } from '../src/data/indicators.ts';

describe('indicators', () => {
  it('computes an SMA only after enough closes exist', () => {
    const bars = [1, 2, 3, 4, 5].map((close, index) => ({ time: index + 1, close }));
    expect(computeSma(bars, 3)).toEqual([
      { time: 3, value: 2 },
      { time: 4, value: 3 },
      { time: 5, value: 4 },
    ]);
  });

  it('emits MACD points after the 12/26/9 warm-up, from closes only', () => {
    const bars = Array.from({ length: 40 }, (_, index) => ({ time: index + 1, close: 100 + index }));
    const points = computeMacd(bars);
    expect(points.length).toBeGreaterThan(0);
    expect(points[0].time).toBe(34);
    expect(points[0].macd).toBeCloseTo(7, 8);
    expect(points[0].signal).toBeCloseTo(7, 8);
    expect(points[0].histogram).toBeCloseTo(0, 8);
    expect(points[0].histogram).toBeCloseTo(points[0].macd - points[0].signal, 12);
  });

  it('keeps only real volume points and does not invent a missing bar', () => {
    const points = volumePoints([
      { time: 1, open: 1, high: 2, low: 1, close: 2, volume: 10 },
      { time: 2, open: 2, high: 2, low: 1, close: 1 },
      { time: 3, open: 1, high: 1, low: 1, close: 1, volume: Number.NaN },
    ]);
    expect(points).toEqual([{ time: 1, value: 10, up: true }]);
  });
});

import { describe, expect, it } from 'vitest';
import { analyze, SeriesError } from '../src/engine/analyze.ts';
import { raw } from './helpers.ts';

describe('analyze', () => {
  it('accepts an empty series and a series too short for a hub', () => {
    expect(analyze([])).toMatchObject({ bi: [], biHubs: [], segmentHubs: [] });
    const rising = [0, 1, 2, 3].map((day) => raw(1_700_000_000 + day * 86_400, 10 + day, 8 + day));
    const result = analyze(rising);
    expect(result.biHubs).toEqual([]);
    expect(result.segmentHubs).toEqual([]);
  });

  it('rejects a high below the low, a flat clock, and a close outside the range', () => {
    const base = 1_700_000_000;
    expect(() => analyze([raw(base, 9, 10)])).toThrow(SeriesError);
    expect(() => analyze([raw(base, 12, 10), raw(base, 13, 11)])).toThrow(/time/);
    expect(() => analyze([raw(base, 12, 10, 13, 11)])).toThrow(/open or close/);
  });

  it('preserves alternating stroke and segment invariants', () => {
    const bars = Array.from({ length: 40 }, (_, i) => {
      const wave = Math.sin(i * 0.7) * 10 + i * 0.3;
      return raw(1_700_000_000 + i * 86_400, wave + 2, wave - 2, wave - 0.5, wave + 0.5);
    });
    const result = analyze(bars);
    for (let i = 1; i < result.bi.length; i += 1) {
      expect(result.bi[i].direction).not.toBe(result.bi[i - 1].direction);
      expect(result.bi[i].startPrice).toBe(result.bi[i - 1].endPrice);
    }
    for (const seg of result.segments) {
      if (!seg.finished) continue;
      if (seg.direction === 'up') expect(seg.endPrice).toBe(seg.high);
      else expect(seg.endPrice).toBe(seg.low);
    }
  });
});

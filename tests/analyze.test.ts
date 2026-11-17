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
});

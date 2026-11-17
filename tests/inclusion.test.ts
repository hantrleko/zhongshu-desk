import { describe, expect, it } from 'vitest';
import { mergeInclusion, rangesInclude, resolveDirection } from '../src/engine/inclusion.ts';
import { raw } from './helpers.ts';

const t = (day: number) => 1_700_000_000 + day * 86_400;

describe('inclusion', () => {
  it('treats equal highs and lows as down', () => {
    expect(resolveDirection({ high: 10, low: 5 }, { high: 10, low: 5 })).toBe('down');
    expect(resolveDirection({ high: 10, low: 5 }, { high: 10, low: 6 })).toBe('up');
  });

  it('detects either bar containing the other', () => {
    expect(rangesInclude({ high: 10, low: 4 }, { high: 9, low: 5 })).toBe(true);
    expect(rangesInclude({ high: 9, low: 5 }, { high: 12, low: 3 })).toBe(true);
    expect(rangesInclude({ high: 10, low: 8 }, { high: 12, low: 9 })).toBe(false);
  });

  it('passes non-including bars through and records direction', () => {
    const merged = mergeInclusion([raw(t(0), 12, 9, 10, 11), raw(t(1), 15, 12, 13, 14)]);
    expect(merged).toHaveLength(2);
    expect(merged[1].direction).toBe('up');
    expect(merged[1].high).toBe(15);
    expect(merged[1].low).toBe(12);
    expect(merged[0].rawCount).toBe(1);
  });

  it('merges a first pair downward when the second bar is inside', () => {
    const merged = mergeInclusion([raw(t(0), 20, 10), raw(t(1), 18, 12)]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ high: 18, low: 10, rawCount: 2, startIndex: 0, endIndex: 1, direction: 'flat' });
    expect(merged[0].close).toBe(18);
  });

  it('merges upward once a prior bar has set the direction', () => {
    const merged = mergeInclusion([raw(t(0), 10, 8), raw(t(1), 14, 11), raw(t(2), 13, 12)]);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({ high: 14, low: 12, direction: 'up', rawCount: 2, startIndex: 1, endIndex: 2 });
  });

  it('merges downward from the established direction', () => {
    const merged = mergeInclusion([raw(t(0), 20, 14), raw(t(1), 16, 10), raw(t(2), 15, 11)]);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({ high: 15, low: 10, direction: 'down', rawCount: 2 });
  });

  it('folds a chain of inclusions into one bar', () => {
    const merged = mergeInclusion([raw(t(0), 10, 5), raw(t(1), 9, 6), raw(t(2), 8, 6)]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ high: 8, low: 5, rawCount: 3, endIndex: 2 });
  });

  it('does not pull the previous bar into an upward merge', () => {
    const merged = mergeInclusion([raw(t(0), 10, 8), raw(t(1), 12, 9), raw(t(2), 13, 7)]);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ high: 10, low: 8, rawCount: 1 });
    expect(merged[1]).toMatchObject({ high: 13, low: 9, rawCount: 2 });
    expect(rangesInclude(merged[0], merged[1])).toBe(false);
  });

  it('returns an empty list for an empty series', () => {
    expect(mergeInclusion([])).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze.ts';
import { fixtures } from '../src/data/fixtures.ts';
import { resampleWeekly } from '../src/data/resample.ts';
import { barCountForTurns } from '../src/data/synthesize.ts';

describe('fixtures', () => {
  it('builds weekday bars with opens and closes inside the range', () => {
    for (const fixture of fixtures) {
      expect(fixture.bars.length).toBe(barCountForTurns(fixture.turns.length));
      for (const bar of fixture.bars) {
        const day = new Date(bar.time * 1000).getUTCDay();
        expect(day).not.toBe(0);
        expect(day).not.toBe(6);
        expect(bar.high).toBeGreaterThanOrEqual(bar.low);
        expect(bar.open).toBeGreaterThanOrEqual(bar.low);
        expect(bar.open).toBeLessThanOrEqual(bar.high);
        expect(bar.close).toBeGreaterThanOrEqual(bar.low);
        expect(bar.close).toBeLessThanOrEqual(bar.high);
      }
    }
  });

  it('lesson 1 has one extended bi hub that leaves upward, plus a third-class buy', () => {
    const analysis = analyze(fixtures[0].bars);
    expect(analysis.bi).toHaveLength(9);
    expect(analysis.biHubs).toHaveLength(1);
    expect(analysis.biHubs[0]).toMatchObject({
      zg: 128.5,
      zd: 107.5,
      gg: 140.5,
      dd: 99.5,
      status: 'left-up',
      extended: true,
      startSwing: 0,
      endSwing: 6,
    });
    expect(analysis.biMarks).toEqual([
      expect.objectContaining({ kind: 'buy3', price: 131.5, hubId: 'bi-hub-1' }),
    ]);
    expect(analysis.biHubs[0].memberIds).toHaveLength(7);
    expect(analysis.segments).toEqual([
      expect.objectContaining({ finished: false, startBi: 0, endBi: 8, direction: 'up' }),
    ]);
    expect(analysis.segmentHubs).toEqual([]);
  });

  it('lesson 2 has two adjacent bi hubs with separated price zones', () => {
    const analysis = analyze(fixtures[1].bars);
    expect(analysis.biHubs).toHaveLength(2);
    const [first, second] = analysis.biHubs;
    expect(first).toMatchObject({ zg: 120.5, zd: 99.5, gg: 148.5, dd: 79.5, status: 'left-up', endSwing: 4 });
    expect(second).toMatchObject({ zg: 148.5, zd: 139.5, gg: 160.5, dd: 131.5, status: 'active', startSwing: 5, extended: false });
    expect(second.startSwing).toBe(first.endSwing + 1);
    expect(second.zd).toBeGreaterThan(first.zg);
    expect(first.memberIds.some((id) => second.memberIds.includes(id))).toBe(false);
    expect(analysis.segments).toEqual([
      expect.objectContaining({ finished: false, startBi: 0, endBi: 6, direction: 'up' }),
    ]);
    expect(analysis.segmentHubs).toEqual([]);
  });

  it('lesson 3 has strokes and no hub', () => {
    const analysis = analyze(fixtures[2].bars);
    expect(analysis.fractals.length).toBeGreaterThanOrEqual(2);
    expect(analysis.bi).toHaveLength(2);
    expect(analysis.segments).toEqual([]);
    expect(analysis.biHubs).toEqual([]);
    expect(analysis.segmentHubs).toEqual([]);
    expect(analysis.biMarks).toEqual([]);
  });

  it('still analyzes the weekly aggregate of lesson 1', () => {
    const weekly = resampleWeekly(fixtures[0].bars);
    expect(weekly.length).toBeGreaterThan(1);
    expect(weekly.length).toBeLessThan(fixtures[0].bars.length);
    expect(() => analyze(weekly)).not.toThrow();
  });

  it('is stable when run twice', () => {
    const fixture = fixtures[0];
    expect(analyze(fixture.bars)).toEqual(analyze(fixture.bars));
  });
});

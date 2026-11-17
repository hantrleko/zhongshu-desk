import { describe, expect, it } from 'vitest';
import { applyTimeframe, resampleWeekly, weekStart } from '../src/data/resample.ts';
import type { Bar } from '../src/engine/types.ts';

function bar(time: number, open: number, high: number, low: number, close: number): Bar {
  return { time, open, high, low, close };
}

describe('resample', () => {
  it('groups Thursday and Friday, and keeps the next Monday apart', () => {
    const thu = Date.UTC(2024, 0, 4) / 1000;
    const fri = Date.UTC(2024, 0, 5) / 1000;
    const mon = Date.UTC(2024, 0, 8) / 1000;
    expect(weekStart(thu)).toBe(weekStart(fri));
    expect(weekStart(mon)).toBeGreaterThan(weekStart(fri));
    const weekly = resampleWeekly([
      bar(thu, 10, 12, 9, 11),
      bar(fri, 11, 14, 8, 13),
      bar(mon, 13, 15, 12, 14),
    ]);
    expect(weekly).toEqual([
      { time: weekStart(thu), open: 10, high: 14, low: 8, close: 13 },
      { time: weekStart(mon), open: 13, high: 15, low: 12, close: 14 },
    ]);
  });

  it('keeps daily lessons intact for intraday chips', () => {
    const daily = [bar(Date.UTC(2024, 0, 2) / 1000, 10, 12, 9, 11), bar(Date.UTC(2024, 0, 3) / 1000, 11, 13, 10, 12)];
    expect(applyTimeframe(daily, '5m')).toEqual(daily);
    expect(applyTimeframe(daily, '15m')).toEqual(daily);
    expect(applyTimeframe(daily, '30m')).toEqual(daily);
    expect(applyTimeframe(daily, '1h')).toEqual(daily);
    expect(applyTimeframe(daily, 'D')).toEqual(daily);
    expect(applyTimeframe(daily, 'W')).toHaveLength(1);
  });
});

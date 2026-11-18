import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze.ts';
import { fixtures } from '../src/data/fixtures.ts';
import { applyTimeframe } from '../src/data/resample.ts';
import { formatBarClock, formatDay, formatUtcDateTime } from '../src/format.ts';
import {
  emptyHubReason,
  lastBarClock,
  markAnchor,
  markChartLabel,
  partitionLastSwing,
  resolveShownTimeframe,
} from '../src/ui/clarity.ts';

describe('shown timeframe on lessons versus live quotes', () => {
  it('keeps daily and weekly on a lesson, and does not leave a minute chip selected', () => {
    expect(resolveShownTimeframe('D', false)).toBe('D');
    expect(resolveShownTimeframe('W', false)).toBe('W');
    expect(resolveShownTimeframe('5m', false)).toBe('D');
    expect(resolveShownTimeframe('15m', false)).toBe('D');
    expect(resolveShownTimeframe('30m', false)).toBe('D');
    expect(resolveShownTimeframe('1h', false)).toBe('D');
  });

  it('keeps the requested public-quote interval, including minutes', () => {
    expect(resolveShownTimeframe('5m', true)).toBe('5m');
    expect(resolveShownTimeframe('1h', true)).toBe('1h');
    expect(resolveShownTimeframe('W', true)).toBe('W');
  });
});

describe('bar clock', () => {
  // 20:00 UTC on 23 Feb 2024 is already 04:00 on 24 Feb in UTC+8.
  const lateUtc = Date.UTC(2024, 1, 23, 20, 0, 0) / 1000;

  it('prints the source UTC date, not a later local calendar day', () => {
    expect(formatDay(lateUtc)).toBe('2024-02-23');
    expect(formatUtcDateTime(lateUtc)).toBe('2024-02-23 20:00');
    expect(formatBarClock(lateUtc, false)).toBe('2024-02-23 UTC');
    expect(formatBarClock(lateUtc, true)).toBe('2024-02-23 20:00 UTC');
  });

  it('uses the last bar time when one exists, and stays silent when the series is empty', () => {
    const last = fixtures[0].bars[fixtures[0].bars.length - 1];
    expect(lastBarClock(last, 'D')).toBe(`${formatDay(last.time)} UTC`);
    expect(lastBarClock(last, '5m')).toBe(`${formatUtcDateTime(last.time)} UTC`);
    expect(lastBarClock(undefined, 'D')).toBeNull();
  });
});

describe('empty hub reasons', () => {
  it('explains lesson 3 from the actual stroke count, without inventing a hub', () => {
    const analysis = analyze(fixtures[2].bars);
    expect(analysis.biHubs).toEqual([]);
    const reason = emptyHubReason({
      level: 'bi',
      barCount: fixtures[2].bars.length,
      strokeCount: analysis.bi.length,
      segmentCount: analysis.segments.length,
      finishedSegments: 0,
      timeframe: 'D',
    });
    expect(reason).toEqual({ kind: 'need-strokes', bars: 11, strokes: 2 });
  });

  it('explains a weekly lesson that has candles but no strokes', () => {
    const weekly = applyTimeframe(fixtures[0].bars, 'W');
    const analysis = analyze(weekly);
    expect(analysis.bi).toHaveLength(0);
    expect(analysis.biHubs).toEqual([]);
    const reason = emptyHubReason({
      level: 'bi',
      barCount: weekly.length,
      strokeCount: analysis.bi.length,
      segmentCount: analysis.segments.length,
      finishedSegments: 0,
      timeframe: 'W',
    });
    expect(reason).toEqual({ kind: 'weekly-no-structure', bars: 8, strokes: 0 });
  });

  it('explains a missing segment hub from the actual segment count', () => {
    const analysis = analyze(fixtures[0].bars);
    expect(analysis.segmentHubs).toEqual([]);
    const finished = analysis.segments.filter((segment) => segment.finished).length;
    const reason = emptyHubReason({
      level: 'segment',
      barCount: fixtures[0].bars.length,
      strokeCount: analysis.bi.length,
      segmentCount: analysis.segments.length,
      finishedSegments: finished,
      timeframe: 'D',
    });
    expect(reason).toEqual({ kind: 'need-segments', segments: 1, finished: 0 });
  });
});

describe('chart marks and the last stroke', () => {
  it('labels third-class marks with buy or sell words, not a shared digit', () => {
    expect(markChartLabel('buy3', { buy: '三买', sell: '三卖' })).toBe('三买');
    expect(markChartLabel('sell3', { buy: '三买', sell: '三卖' })).toBe('三卖');
    expect(markChartLabel('buy3', { buy: '3rd buy', sell: '3rd sell' })).toBe('3rd buy');
  });

  it('places the buy word under the valley and the sell word above the peak', () => {
    expect(markAnchor('buy3')).toBe('below');
    expect(markAnchor('sell3')).toBe('above');
  });

  it('treats only the last stroke as unconfirmed', () => {
    expect(partitionLastSwing([])).toEqual({ confirmed: [], unconfirmed: [] });
    expect(partitionLastSwing(['a'])).toEqual({ confirmed: [], unconfirmed: ['a'] });
    expect(partitionLastSwing(['a', 'b', 'c'])).toEqual({ confirmed: ['a', 'b'], unconfirmed: ['c'] });
  });
});

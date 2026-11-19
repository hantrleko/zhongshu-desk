import { describe, expect, it } from 'vitest';
import type { Bar, Hub } from '../src/engine/types.ts';
import { buildResearch, validResearchBars } from '../src/ui/research.ts';
import { researchCommentary, researchCopy, scenarioText, levelPosition, rangeAssessment } from '../src/ui/research-copy.ts';
import { computeMacd } from '../src/data/indicators.ts';
import { copy } from '../src/i18n.ts';
import { evidenceVisibleLogicalRange } from '../src/ui/clarity.ts';

function bars(count: number, direction = 1): Bar[] {
  return Array.from({ length: count }, (_, i) => {
    const close = 100 + i * direction;
    return { time: 1_700_000_000 + i * 86400, open: close, high: close + 2, low: close - 2, close, volume: 100 };
  });
}
const hub: Hub = {
  id: 'hub', level: 'bi', startTime: 1_700_000_000, endTime: 1_700_000_000 + 15 * 86400,
  startSwing: 0, endSwing: 2, zg: 115, zd: 110, gg: 120, dd: 100,
  memberIds: ['1', '2', '3'], status: 'active', extended: false, enterDirection: 'up', leaveDirection: 'none',
};

describe('evidence calculations', () => {
  it('uses 20 closes and the immediately previous average for direction', () => {
    const r = buildResearch(bars(21));
    expect(r.ma20).toBe(110.5);
    expect(r.maSlope).toBe(1);
    expect(r.trend).toBe('rising');
    expect(r.deviation).toBeCloseTo((120 / 110.5 - 1) * 100);
    const down = buildResearch(bars(21, -1));
    expect(down.ma20).toBe(89.5);
    expect(down.maSlope).toBe(-1);
    expect(down.trend).toBe('falling');
  });
  it('does not infer a trend before 21 bars or from equality', () => {
    expect(buildResearch(bars(19)).ma20).toBeUndefined();
    expect(buildResearch(bars(20)).ma20).toBe(109.5);
    expect(buildResearch(bars(20)).trend).toBe('insufficient');
    expect(buildResearch(bars(21, 0)).trend).toBe('mixed');
    const sequence = bars(21);
    sequence[20] = { ...sequence[20], open: 105, high: 107, low: 103, close: 105 };
    expect(buildResearch(sequence).trend).toBe('mixed');
  });
  it('excludes the latest bar from the entire 20-bar high/low and volume baseline', () => {
    const sequence = bars(21);
    sequence[20].high = 999;
    sequence[20].low = 1;
    sequence[20].volume = 200;
    const r = buildResearch(sequence);
    expect(r.range).toEqual({ high: 121, low: 98, from: sequence[0].time, to: sequence[19].time });
    expect(r.volumeRatio).toBe(2);
    expect(sequence[20].high).toBe(999);
  });
  it('omits volume comparisons for missing, nonfinite, negative or zero-baseline volume', () => {
    for (const missing of [undefined, NaN, -1]) {
      const sequence = bars(21);
      sequence[7].volume = missing;
      expect(buildResearch(sequence).volumeRatio).toBeUndefined();
    }
    const sequence = bars(21);
    sequence.forEach(bar => bar.volume = 0);
    expect(buildResearch(sequence).volumeRatio).toBeUndefined();
    sequence.forEach(bar => bar.volume = 100);
    sequence[20].volume = undefined;
    expect(buildResearch(sequence).volumeRatio).toBeUndefined();
    sequence[20].volume = 0;
    expect(buildResearch(sequence).volumeRatio).toBe(0);
  });
  it('uses the existing indicator implementation without implying Chan divergence', () => {
    expect(buildResearch(bars(33)).dif).toBeUndefined();
    const sequence = bars(45);
    const expected = computeMacd(sequence).at(-1)!;
    const r = buildResearch(sequence);
    expect(r.dif).toBe(expected.macd);
    expect(r.dea).toBe(expected.signal);
    expect(r.histogram).toBe(expected.macd - expected.signal);
  });
  it('sorts signed distances by proximity and preserves provisional status and evidence dates', () => {
    const r = buildResearch(bars(21), hub, true);
    expect(r.levels).toHaveLength(4);
    expect(r.levels.map(level => level.price)).toEqual([121, 115, 110, 98]);
    expect(r.levels[0].distance).toBeCloseTo(100 / 120);
    expect(r.levels[1].distance).toBeCloseTo((115 / 120 - 1) * 100);
    expect(r.levels[1].provisional).toBe(true);
    expect(r.levels[1].from).toBe(hub.startTime);
    expect(buildResearch(bars(21), hub, false).levels.find(level => level.kind === 'hubHigh')?.provisional).toBe(false);
  });
  it('does not use a future or invalid hub', () => {
    expect(buildResearch(bars(21), { ...hub, endTime: 9e12 }).levels).toHaveLength(2);
    expect(buildResearch(bars(21), { ...hub, zd: 115 }).levels).toHaveLength(2);
    expect(buildResearch(bars(21), { ...hub, zg: Infinity }).levels).toHaveLength(2);
  });
  it('rejects out-of-order, duplicate, invalid or nonpositive prices without sorting or repairing', () => {
    const sequence = bars(21);
    [sequence[3], sequence[4]] = [sequence[4], sequence[3]];
    expect(validResearchBars(sequence)).toBe(false);
    expect(buildResearch(sequence).close).toBeUndefined();
    const duplicate = bars(21);
    duplicate[4].time = duplicate[3].time;
    expect(buildResearch(duplicate).trend).toBe('insufficient');
    for (const invalid of [NaN, 0, -1]) {
      const invalidBars = bars(21);
      invalidBars[10].low = invalid;
      expect(buildResearch(invalidBars).levels).toEqual([]);
    }
    const invalidBars = bars(21);
    invalidBars[10].high = invalidBars[10].close - 1;
    expect(validResearchBars(invalidBars)).toBe(false);
    expect(buildResearch([]).close).toBeUndefined();
  });
  it('ignores bars outside the calculation window, with no look-ahead', () => {
    const prefix = bars(21);
    const first = buildResearch(prefix);
    const extended = [...prefix, { ...prefix[20], time: prefix[20].time + 86400, high: 1001, low: 998, open: 1000, close: 1000 }];
    expect(buildResearch(extended.slice(0, 21))).toEqual(first);
    expect(buildResearch(extended).range?.high).toBe(122);
  });
});

describe('research language and conditional limits', () => {
  it('states mechanism and actual values, not predictions, and distinguishes bar close from quote snapshot', () => {
    const r = buildResearch(bars(21));
    expect(researchCommentary(r, 'zh')).toContain('末根收盘 120.00');
    expect(researchCommentary(r, 'zh')).toContain('MA20（110.50）');
    expect(researchCommentary(r, 'en')).toContain('Last bar close 120.00');
    for (const lang of ['zh', 'en'] as const) {
      const text = researchCommentary(r, lang);
      expect(text).not.toMatch(/现在怎样|还没走完|图上有|必涨|胜率|guarantee/);
      expect(researchCommentary(buildResearch([]), lang)).toBe(researchCopy(lang).empty);
      expect(researchCommentary(buildResearch(bars(20)), lang)).not.toContain('技术形态偏强');
    }
  });
  it('anchors upside/downside conditions to the prior window and explicitly invalidates them', () => {
    const r = buildResearch(bars(21));
    const zh = scenarioText(r, 'zh')!;
    expect(zh.upper).toContain('高于 121.00');
    expect(r.rangePosition).toBe('inside');
    expect(rangeAssessment(r, 'zh')).toContain('尚未满足');
    expect(zh.upper).toContain('不再满足突破条件');
    expect(zh.lower).toContain('低于 98.00');
    expect(scenarioText(r, 'en')?.lower).toContain('invalidates');
    expect(scenarioText(buildResearch(bars(20)), 'zh')).toBeNull();
    expect(levelPosition(r.levels[0], 'zh')).toContain('上方参考');
    expect(levelPosition(r.levels[1], 'en')).toContain('Lower reference');
  });
  it('requires a strict range break and never treats a forming close as confirmed', () => {
    const sequence = bars(21);
    for (const [close, expected] of [[121, 'inside'], [122, 'above'], [97, 'below']] as const) {
      sequence[20] = { ...sequence[20], open: close, close, high: close + 2, low: close - 2 };
      const r = buildResearch(sequence);
      expect(r.rangePosition).toBe(expected);
      if (expected !== 'inside') {
        expect(rangeAssessment(r, 'zh')).toContain('不宜据此确认');
        expect(rangeAssessment(r, 'en')).toContain('unfinished');
      }
    }
  });
  it('keeps provisional and indicator limitations explicit in both languages', () => {
    expect(copy('zh').reading({ bi: { direction: 'up' } })).toContain('尚未确认');
    expect(copy('en').reading({ bi: { direction: 'up' } })).toContain('provisional');
    expect(researchCopy('zh').definition).toContain('不据此推断背驰');
    expect(researchCopy('en').definition).toContain('No divergence inference');
    expect(copy('zh').summary).toBe('结构研判');
    expect(copy('zh').emptyWeekly(21, 1)).not.toContain('日线');
    expect(copy('en').emptyWeekly(21, 1)).not.toContain('lesson');
  });
});

describe('evidence chart focus', () => {
  it('focuses the same count of bars at daily and 5-minute spacing', () => {
    for (const spacing of [300, 86400, 7 * 86400]) {
      const times = Array.from({ length: 100 }, (_, i) => 1_700_000_000 + i * spacing);
      expect(evidenceVisibleLogicalRange(times, times[79], times[99])).toEqual({ from: 74, to: 104 });
    }
  });
  it('handles a single bar, empty history and a nonoverlapping window', () => {
    expect(evidenceVisibleLogicalRange([100, 200, 300], 200, 200)).toEqual({ from: -1, to: 3 });
    expect(evidenceVisibleLogicalRange([], 1, 2)).toBeNull();
    expect(evidenceVisibleLogicalRange([100, 200, 300], 210, 290)).toBeNull();
    expect(evidenceVisibleLogicalRange([100], 200, 300)).toBeNull();
    expect(evidenceVisibleLogicalRange([100], 300, 200)).toBeNull();
  });
});

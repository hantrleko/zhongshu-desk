import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze.ts';
import { fixtures } from '../src/data/fixtures.ts';
import { resampleWeekly } from '../src/data/resample.ts';
import { acceptQuote, initialSession, noteEmptySymbol, rejectQuote, requestQuote } from '../src/desk/session.ts';
import { presentProvenance, presentStructureGap, segmentConfirmation, strokeConfirmation } from '../src/desk/present.ts';
import { copy, type Lang } from '../src/i18n.ts';

const lesson = fixtures[0];
const reasons = ['Yahoo: Failed to fetch', 'Stooq: Failed to fetch'];

function assertNoLiveClaim(text: string): void {
  expect(text).not.toMatch(/实时行情已|实时推送中|streaming live|\bLIVE\b/);
}

describe('provenance', () => {
  it('names the lesson, not AAPL, when both public reads fail', () => {
    for (const lang of ['zh', 'en'] as const) {
      const view = presentProvenance({
        lang,
        session: rejectQuote(requestQuote(initialSession(lesson.id), 'AAPL', 'D'), 'AAPL', 'D', reasons, 'quote'),
        timeframe: 'D',
        fixture: lesson,
        bars: lesson.bars,
        hubCount: 1,
      });
      expect(view.fallback).toBe(true);
      expect(view.teachingPrices).toBe(true);
      expect(view.shownKind).toBe('lesson');
      expect(view.shownId).toBe('single-hub');
      expect(view.requestedSymbol).toBe('AAPL');
      expect(view.title).toBe(lesson.title[lang]);
      expect(view.title).not.toContain('AAPL');
      expect(view.alert).toContain('AAPL');
      expect(view.alert).toContain(lesson.title[lang]);
      expect(view.teachingNote).toContain('AAPL');
      expect(view.range).toContain('2024-01-02');
      expect(view.range).toContain('2024-02-23');
      expect(view.range).toContain('39');
      expect(view.fetchStatus).toContain('Yahoo: Failed to fetch');
      expect(view.fetchStatus).toContain('Stooq: Failed to fetch');
      expect(view.banner).toEqual([view.alert]);
      assertNoLiveClaim(`${view.title} ${view.alert} ${view.source} ${view.fetchStatus} ${view.teachingNote}`);
      if (lang === 'zh') {
        expect(view.alert).toContain('不是 AAPL');
        expect(view.source).toContain('教学价格');
        expect(view.source).toContain('不是实时行情');
        expect(view.kindLabel).toBe('不是 AAPL');
      } else {
        expect(view.alert).toContain('not AAPL');
        expect(view.source).toContain('teaching prices');
        expect(view.source).toContain('not a live feed');
        expect(view.kindLabel).toBe('Not AAPL');
      }
    }
  });

  it('does not retitle the chart while AAPL is still loading', () => {
    const view = presentProvenance({
      lang: 'zh',
      session: requestQuote(initialSession(lesson.id), 'AAPL', 'D'),
      timeframe: 'D',
      fixture: lesson,
      bars: lesson.bars,
      hubCount: 1,
    });
    expect(view.pending).toBe(true);
    expect(view.fallback).toBe(false);
    expect(view.title).toBe(lesson.title.zh);
    expect(view.title).not.toContain('AAPL');
    expect(view.fetchStatus).toContain('AAPL');
    expect(view.fetchStatus).toContain('还不是 AAPL');
    expect(view.banner).toEqual([view.fetchStatus]);
  });

  it('keeps the previous AAPL bars labeled as AAPL while a new timeframe is in flight', () => {
    const session = requestQuote(acceptQuote(initialSession(lesson.id), 'AAPL', 'yahoo', 'D'), 'AAPL', 'W');
    const view = presentProvenance({
      lang: 'zh',
      session,
      timeframe: 'D',
      fixture: lesson,
      bars: lesson.bars,
      hubCount: 1,
    });
    expect(view.title).toBe('AAPL');
    expect(view.shownKind).toBe('quote');
    expect(view.source).toContain('日线');
    expect(view.fetchStatus).toContain('周线');
    expect(view.fetchStatus).toContain('新的 K 线还没到');
    expect(view.fetchStatus).not.toContain('还不是 AAPL');
  });

  it('labels a successful read with its source and refuses a live claim', () => {
    const view = presentProvenance({
      lang: 'en',
      session: acceptQuote(initialSession(lesson.id), 'AAPL', 'yahoo', 'D'),
      timeframe: 'D',
      fixture: lesson,
      bars: [{ time: Date.UTC(2024, 5, 3, 14, 30) / 1000 }, { time: Date.UTC(2024, 5, 3, 15, 30) / 1000 }],
      hubCount: 0,
    });
    expect(view.fallback).toBe(false);
    expect(view.teachingPrices).toBe(false);
    expect(view.teachingNote).toBeNull();
    expect(view.title).toBe('AAPL');
    expect(view.kindLabel).toBe('Public quote');
    expect(view.source).toContain('Yahoo');
    expect(view.source).toContain('not a live feed');
    expect(view.fetchStatus).toContain('succeeded, from Yahoo');
    expect(view.fetchStatus).toContain('not a live feed');
    expect(view.range).toContain('2024-06-03 14:30 UTC');
    expect(view.range).toContain('2024-06-03 15:30 UTC');
    assertNoLiveClaim(`${view.source} ${view.fetchStatus} ${view.blurb}`);
  });

  it('says a lesson has no minute bars and does not describe the daily series as 5-minute', () => {
    const view = presentProvenance({
      lang: 'zh',
      session: initialSession(lesson.id),
      timeframe: '5m',
      fixture: lesson,
      bars: lesson.bars,
      hubCount: 1,
    });
    expect(view.title).toBe(lesson.title.zh);
    expect(view.source).toContain('没有 5 分钟');
    expect(view.source).toContain('仍是日线');
    expect(view.source).toContain('没有把日线拆成更细的价格');
    expect(view.range).toContain('39');
    expect(view.fetchStatus).toContain('没有请求公开行情');
  });

  it('stamps a lesson week with Monday and counts the weekly bars', () => {
    const weekly = resampleWeekly(lesson.bars);
    const view = presentProvenance({
      lang: 'zh',
      session: initialSession(lesson.id),
      timeframe: 'W',
      fixture: lesson,
      bars: weekly,
      hubCount: 0,
    });
    expect(view.range).toContain('2024-01-01');
    expect(view.range).toContain('2024-02-19');
    expect(view.range).toContain(`${weekly.length}`);
    expect(view.range).toContain('周一');
    expect(view.source).toContain('教学价格');
    expect(view.source).toContain('不是另一套行情');
  });

  it('leaves an empty symbol box on the series already shown', () => {
    const view = presentProvenance({
      lang: 'zh',
      session: noteEmptySymbol(acceptQuote(initialSession(lesson.id), 'AAPL', 'yahoo', 'D'), 'D'),
      timeframe: 'D',
      fixture: lesson,
      bars: lesson.bars,
      hubCount: 1,
    });
    expect(view.title).toBe('AAPL');
    expect(view.fallback).toBe(false);
    expect(view.alert).toContain('AAPL');
    expect(view.alert).toContain('先写一个代码');
    expect(view.fetchStatus).toContain('代码是空的');
  });
});

describe('structure gap', () => {
  it('explains the blank weekly overlay instead of inventing a hub', () => {
    const weekly = resampleWeekly(lesson.bars);
    const analysis = analyze(weekly);
    for (const lang of ['zh', 'en'] as Lang[]) {
      const gap = presentStructureGap({ lang, level: 'bi', barCount: weekly.length, analysis });
      expect(gap.show).toBe(true);
      expect(gap.code).toBe('no-stroke');
      expect(gap.body).toContain(String(weekly.length));
      expect(gap.body).toContain(String(analysis.merged.length));
      expect(gap.body).toContain('4');
      if (lang === 'zh') expect(gap.body).toContain('不补结构');
      else expect(gap.body).toContain('Nothing is filled in');
      expect(gap.body).not.toMatch(/ZG\s+128/);
    }
  });

  it('keeps the daily stroke hub and explains the missing segment hub', () => {
    const analysis = analyze(lesson.bars);
    const stroke = presentStructureGap({ lang: 'zh', level: 'bi', barCount: lesson.bars.length, analysis });
    expect(stroke).toMatchObject({ show: false, code: 'none' });
    const segment = presentStructureGap({ lang: 'zh', level: 'segment', barCount: lesson.bars.length, analysis });
    expect(segment.show).toBe(true);
    expect(segment.code).toBe('segment-short');
    expect(segment.body).toContain('1 段');
    expect(segment.body).toContain('0 段已确认');
    expect(segment.body).toContain('1 段未确认');
    expect(segment.body).toContain('不把笔中枢当成段中枢');
    expect(segment.body).toContain('也不编造线段');
  });

  it('says lesson 3 is short a stroke, and short of a segment', () => {
    const analysis = analyze(fixtures[2].bars);
    const stroke = presentStructureGap({ lang: 'en', level: 'bi', barCount: fixtures[2].bars.length, analysis });
    expect(stroke.code).toBe('hub-short');
    expect(stroke.body).toContain('2 strokes');
    expect(stroke.body).toContain('not filled in');
    const segment = presentStructureGap({ lang: 'zh', level: 'segment', barCount: fixtures[2].bars.length, analysis });
    expect(segment.code).toBe('no-segment');
    expect(segment.body).toContain('2 笔');
    expect(segment.body).toContain('不编造线段');
  });
});

describe('confirmation words', () => {
  it('marks only the last stroke unconfirmed', () => {
    expect(strokeConfirmation(0, 0)).toBe('none');
    expect(strokeConfirmation(-1, 9)).toBe('none');
    expect(strokeConfirmation(8, 9)).toBe('unconfirmed');
    expect(strokeConfirmation(7, 9)).toBe('confirmed');
    expect(strokeConfirmation(0, 1)).toBe('unconfirmed');
  });

  it('follows the segment finished flag', () => {
    expect(segmentConfirmation(undefined)).toBe('none');
    expect(segmentConfirmation({ finished: false })).toBe('unconfirmed');
    expect(segmentConfirmation({ finished: true })).toBe('confirmed');
  });
});

describe('glossary', () => {
  it('uses the same terms in both languages and separates confirmation from the school', () => {
    const ids = ['bi', 'seg', 'zs', 'zg', 'zd', 'gg', 'dd', 'bsp'];
    for (const lang of ['zh', 'en'] as const) {
      const ui = copy(lang);
      expect(ui.glossaryEntries.map((entry) => entry.id)).toEqual(ids);
      expect(new Set(ui.glossaryEntries.map((entry) => entry.term)).size).toBe(ids.length);
      for (const entry of ui.glossaryEntries) expect(entry.text.length).toBeGreaterThan(10);
    }
    expect(copy('zh').glossaryConfirm).toContain('已确认');
    expect(copy('zh').glossaryConfirm).toContain('未确认');
    expect(copy('zh').glossarySchool).toContain('不是官方缠论');
    expect(copy('en').glossaryConfirm).toContain('Confirmed');
    expect(copy('en').glossaryConfirm).toContain('Unconfirmed');
    expect(copy('en').glossarySchool).toMatch(/not an official Chan/i);
    expect(copy('zh').glossaryEntries.find((entry) => entry.id === 'bsp')?.text).toContain('不是下单信号');
    expect(copy('en').glossaryEntries.find((entry) => entry.id === 'bsp')?.text).toContain('not an order');
  });
});

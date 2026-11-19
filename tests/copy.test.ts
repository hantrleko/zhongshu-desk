import { describe, expect, it } from 'vitest';
import { copy } from '../src/i18n.ts';
import { bootSymbol } from '../src/ui/app.ts';

const aboveHub = {
  bi: { direction: 'up' as const },
  seg: { direction: 'down' as const, finished: false },
  hub: { zd: '1270.33', zg: '1338.86', place: 'above' as const },
};

describe('reading()', () => {
  it('writes a fluent Chinese paragraph when the last stroke is up and price is above the range', () => {
    expect(copy('zh').reading(aboveHub)).toBe(
      '末笔向上，尚未确认，端点仍可能延伸。线段方向向下，待确认。末根收盘位于最近中枢上方，区间为 1270.33–1338.86。',
    );
  });

  it('ends the Chinese reading with a plain note when there is no range', () => {
    const text = copy('zh').reading({
      bi: { direction: 'up' },
      seg: { direction: 'down', finished: false },
    });
    expect(text).toBe(
      '末笔向上，尚未确认，端点仍可能延伸。线段方向向下，待确认。当前层级暂无有效中枢。',
    );
  });

  it('writes the same meaning in English', () => {
    expect(copy('en').reading(aboveHub)).toBe(
      'The latest stroke points up; it is provisional and its endpoint may extend. The segment points down and is provisional. Last bar close is above the latest hub, 1270.33–1338.86.',
    );
  });

  it('says plainly in Chinese when there is no stroke or segment yet', () => {
    expect(copy('zh').reading({})).toBe(
      '当前样本尚未形成有效笔。线段结构尚未形成。当前层级暂无有效中枢。',
    );
  });
});

describe('stageReading()', () => {
  it('keeps the Chinese stage line compact when price is above an unconfirmed up stroke', () => {
    const text = copy('zh').stageReading(aboveHub);
    expect(text).toBe('末根收盘位于中枢上方；末笔向上，待确认。');
    expect(text.length).toBeLessThanOrEqual(40);
  });

  it('says the range has not formed yet when there is no hub', () => {
    expect(copy('zh').stageReading({ bi: { direction: 'up' } })).toBe('当前层级暂无有效中枢。');
  });

  it('writes a compact English stage line', () => {
    expect(copy('en').stageReading(aboveHub)).toBe(
      'Last bar close is above the hub; the latest up stroke is provisional.',
    );
    expect(copy('en').stageReading({})).toBe('No valid hub at this level.');
  });
});

describe('hubTitle() and counts()', () => {
  it('numbers ranges in Chinese from a 1-based index', () => {
    const ui = copy('zh');
    expect(ui.hubTitle('bi', 1)).toBe('震荡区间 1 · 按笔构成');
    expect(ui.hubTitle('segment', 2)).toBe('震荡区间 2 · 按线段构成');
  });

  it('numbers ranges in English from a 1-based index', () => {
    const ui = copy('en');
    expect(ui.hubTitle('bi', 1)).toBe('Range 1 · built from strokes');
    expect(ui.hubTitle('segment', 2)).toBe('Range 2 · built from segments');
  });

  it('lists structure counts without BI/ZS/BSP alphabet soup', () => {
    expect(copy('zh').counts(321, 21, 2, 3, 2)).toBe(
      '321\u00a0根\u00a0K\u00a0线，21\u00a0笔，2\u00a0条线段，3\u00a0个震荡区间，2\u00a0个买卖点',
    );
    expect(copy('en').counts(321, 21, 2, 3, 2)).toBe(
      '321\u00a0bars, 21\u00a0strokes, 2\u00a0segments, 3\u00a0oscillation ranges, 2\u00a0buy/sell marks',
    );
    expect(copy('en').counts(1, 1, 1, 1, 1)).toBe(
      '1\u00a0bar, 1\u00a0stroke, 1\u00a0segment, 1\u00a0oscillation range, 1\u00a0buy/sell mark',
    );
    const zhCounts = copy('zh').counts(321, 4, 1, 1, 0);
    expect(zhCounts).toContain('1\u00a0个震荡区间');
    expect(zhCounts).toContain('0\u00a0个买卖点');
    expect(zhCounts).not.toMatch(/\d [根笔条个]/);
  });
});

describe('legend MACD copy', () => {
  it('keeps the short label for the chart strip and the full wording for How to read', () => {
    expect(copy('zh').legendMacdShort).toBe('MACD(12,26,9)');
    expect(copy('en').legendMacdShort).toBe('MACD(12,26,9)');
    expect(copy('zh').legendMacd).toBe('MACD(12,26,9)，指标，不是缠论');
    expect(copy('en').legendMacd).toBe('MACD(12,26,9), an indicator, not Chanlun');
  });
});

describe('bootSymbol()', () => {
  it('prefers a valid URL symbol, then storage, then 300308', () => {
    expect(bootSymbol('?symbol=300308', '600519')).toBe('300308');
    expect(bootSymbol('?tf=D&symbol=AAPL', '600519')).toBe('AAPL');
    expect(bootSymbol('?symbol=600519%20贵州', '300750')).toBe('300750');
    expect(bootSymbol('', '000001')).toBe('000001');
    expect(bootSymbol('', '')).toBe('300308');
    expect(bootSymbol('?symbol=', 'not valid!')).toBe('300308');
  });
});

describe('status()', () => {
  it('does not say price is still inside the range when the structure has only not left yet', () => {
    const zh = copy('zh');
    const en = copy('en');
    expect(zh.status('active', true, 'bi')).toBe('中枢延伸，尚无结构性离开');
    expect(zh.status('active', false, 'bi')).toBe('三笔重叠，尚无结构性离开');
    expect(zh.status('left-down', false, 'bi')).toBe('已向下离开');
    expect(en.status('active', true, 'bi')).toBe('Extending, has not left yet');
    expect(zh.status('active', true, 'bi')).not.toMatch(/仍在区间内/);
  });
});



describe('workspace label', () => {
  it('localizes the research header without changing the English label', () => {
    expect(copy('zh').workspaceLabel).toBe('技术研判');
    expect(copy('en').workspaceLabel).toBe('TECHNICAL RESEARCH');
  });
});

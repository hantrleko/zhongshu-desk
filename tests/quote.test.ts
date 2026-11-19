import { describe, expect, it, vi } from 'vitest';
import eastmoneyDay from './fixtures/eastmoney-sh600519-day5.json';
import ifzqMinutes from './fixtures/ifzq-sh600519-m5.json';
import ifzqWeek from './fixtures/ifzq-sh600519-week.json';
import tencentDay from './fixtures/tencent-sh600519-day20.json';
import tencentUsBad from './fixtures/tencent-usAAPL-bad-2bars.json';
import {
  assertUsableBars,
  fetchPublicQuote,
  keepValidBars,
  mapSymbol,
  parseEastmoneyPayload,
  parseStooq,
  parseTencentPayload,
  parseYahoo,
  parseYahooQuote,
  QuoteError,
  yahooWindow,
} from '../src/data/quote.ts';

const dailyCsv = [
  'Date,Open,High,Low,Close,Volume',
  '2024-01-02,10,12,9,11,1',
  '2024-01-03,11,13,10,12,1',
  '2024-01-04,12,14,11,13,1',
  '2024-01-05,13,15,12,14,1',
  '2024-01-08,14,16,13,15,1',
].join('\n');

describe('public quotes', () => {
  it('parses Yahoo bars and skips null ticks', () => {
    const bars = parseYahoo({
      chart: {
        result: [
          {
            timestamp: [1_700_000_000, 1_700_086_400, 1_700_172_800, 1_700_259_200, 1_700_345_600, 1_700_432_000],
            indicators: {
              quote: [
                {
                  open: [10, null, 12, 13, 14, 15],
                  high: [11, 12, 13, 14, 15, 16],
                  low: [9, 10, 11, 12, 13, 14],
                  close: [10.5, 11, 12.5, 13.5, 14.5, 15.5],
                  volume: [100, 0, 80, 90, 70, 60],
                },
              ],
            },
          },
        ],
        error: null,
      },
    });
    expect(bars).toHaveLength(5);
    expect(bars[0].close).toBe(10.5);
    expect(bars[0].volume).toBe(100);
    expect(bars[1].open).toBe(12);
  });

  it('does not invent a price when Yahoo reports an error or too little data', () => {
    expect(() => parseYahoo({ chart: { result: null, error: { description: 'No data found' } } })).toThrow(/No data found/);
    expect(() =>
      parseYahoo({
        chart: {
          result: [{ timestamp: [1], indicators: { quote: [{ open: [1], high: [1], low: [1], close: [1] }] } }],
        },
      }),
    ).toThrow(QuoteError);
  });

  it('parses Stooq CSV and drops incomplete rows', () => {
    const csv = [
      'Date,Open,High,Low,Close,Volume',
      '2024-01-02,10,12,9,11,100',
      '2024-01-03,11,13,10,12,80',
      '2024-01-04,null,null,null,null,0',
      '2024-01-05,12,14,11,13,90',
      '2024-01-08,13,15,12,14,70',
      '2024-01-09,14,16,13,15,70',
    ].join('\n');
    const bars = parseStooq(csv);
    expect(bars).toHaveLength(5);
    expect(bars[0].time).toBe(Date.UTC(2024, 0, 2) / 1000);
    expect(bars[0]).toMatchObject({ open: 10, high: 12, low: 9, close: 11, volume: 100 });
  });

  it('drops an invalid high-low pair instead of swapping it', () => {
    const kept = keepValidBars([
      { time: 10, open: 1, high: 1, low: 2, close: 1 },
      { time: 20, open: 3, high: 4, low: 2, close: 3.5 },
    ]);
    expect(kept).toEqual([{ time: 20, open: 3, high: 4, low: 2, close: 3.5 }]);
  });

  it('rejects a bad symbol before any request', async () => {
    const fetchImpl = vi.fn();
    await expect(fetchPublicQuote('600519 贵州', 'D', fetchImpl)).rejects.toBeInstanceOf(QuoteError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('falls through Eastmoney and Yahoo to Stooq and surfaces the failures', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('stooq.com')) return new Response('not a table', { status: 200 });
      return new Response(JSON.stringify({ chart: { result: null, error: { description: 'No data found' } } }), {
        status: String(url).includes('yahoo') && !String(url).includes('allorigins') ? 200 : 503,
      });
    });
    await expect(fetchPublicQuote('AAPL', 'D', fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({
      reasons: [
        expect.stringContaining('Eastmoney'),
        expect.stringContaining('Eastmoney'),
        expect.stringContaining('No data found'),
        expect.stringContaining('allorigins'),
        expect.stringContaining('Stooq'),
      ],
    });
  });

  it('asks Yahoo for the chip interval and does not relabel Stooq daily bars as intraday', async () => {
    expect(yahooWindow('5m')).toEqual({ interval: '5m', range: '60d' });
    expect(yahooWindow('1h')).toEqual({ interval: '60m', range: '730d' });
    expect(yahooWindow('D')).toEqual({ interval: '1d', range: '2y' });
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('interval=5m')) return new Response('nope', { status: 503 });
      return new Response('Date,Open,High,Low,Close\n2024-01-02,10,12,9,11', { status: 200 });
    });
    await expect(fetchPublicQuote('AAPL', '5m', fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({
      reasons: expect.arrayContaining([expect.stringContaining('Yahoo'), expect.stringContaining('no intraday')]),
    });
    const urls = fetchImpl.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes('stooq.com'))).toBe(false);
    expect(urls.filter((url) => url.includes('interval=5m') || url.includes('klt=5')).length).toBeGreaterThan(0);
  });

  it('uses Stooq when earlier US sources fail and labels the source', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('stooq.com')) return new Response(dailyCsv, { status: 200 });
      return new Response('nope', { status: 503 });
    });
    const quote = await fetchPublicQuote('AAPL', 'D', fetchImpl as unknown as typeof fetch);
    expect(quote.source).toBe('stooq');
    expect(quote.bars).toHaveLength(5);
    expect(quote.bars[4].close).toBe(15);
  });

  it('does not treat teaching fixtures as an automatic fallback', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 503 }));
    await expect(fetchPublicQuote('600519', 'D', fetchImpl as unknown as typeof fetch)).rejects.toBeInstanceOf(QuoteError);
    const error = await fetchPublicQuote('600519', 'D', fetchImpl as unknown as typeof fetch).catch((item: unknown) => item);
    expect(error).toBeInstanceOf(QuoteError);
    if (!(error instanceof QuoteError)) throw new Error('expected QuoteError');
    expect(error.reasons.length).toBeGreaterThan(1);
    expect(error.reasons.join(' ')).not.toMatch(/样例|fixture|lesson/i);
  });
});

describe('symbol mapping', () => {
  it('maps A-share aliases onto Tencent, Eastmoney, and Yahoo codes', () => {
    expect(mapSymbol('600519')).toMatchObject({
      display: '600519',
      market: 'ashare',
      tencent: 'sh600519',
      eastmoney: ['1.600519'],
      yahoo: '600519.SS',
    });
    expect(mapSymbol('sh600519').tencent).toBe('sh600519');
    expect(mapSymbol('600519.SS').eastmoney).toEqual(['1.600519']);
    expect(mapSymbol('000001')).toMatchObject({ tencent: 'sz000001', eastmoney: ['0.000001'], yahoo: '000001.SZ' });
    expect(mapSymbol('300750').tencent).toBe('sz300750');
    expect(mapSymbol('688772').tencent).toBe('sh688772');
    expect(mapSymbol('sh000001')).toMatchObject({ tencent: 'sh000001', eastmoney: ['1.000001'], yahoo: '000001.SS' });
    expect(mapSymbol('000001.SS').tencent).toBe('sh000001');
  });

  it('maps US aliases and does not send US history to Tencent', () => {
    expect(mapSymbol('AAPL')).toMatchObject({
      display: 'AAPL',
      market: 'us',
      yahoo: 'AAPL',
      eastmoney: ['105.AAPL', '106.AAPL'],
    });
    expect(mapSymbol('AAPL').tencent).toBeUndefined();
    expect(mapSymbol('usAAPL').yahoo).toBe('AAPL');
    expect(mapSymbol('AAPL.US').yahoo).toBe('AAPL');
    expect(mapSymbol('0700.HK')).toMatchObject({ market: 'hk', yahoo: '0700.HK' });
  });
});

describe('A-share and US payload parsers', () => {
  it('parses Tencent daily bars as date, open, close, high, low, volume', () => {
    const parsed = parseTencentPayload(tencentDay, 'D');
    expect(parsed.bars.length).toBeGreaterThanOrEqual(20);
    expect(parsed.bars[0]).toMatchObject({
      time: Date.UTC(2026, 9, 22) / 1000,
      open: 1303.21,
      close: 1318.49,
      high: 1322,
      low: 1296,
      volume: 42491,
    });
    expect(parsed.snapshot.name).toBe('贵州茅台');
    expect(parsed.snapshot.last).toBe(1454.5);
    expect(parsed.snapshot.previousClose).toBe(1442.66);
    expect(parsed.snapshot.currency).toBe('CNY');
  });

  it('parses Tencent weekly and 5-minute fixtures without relabeling', () => {
    const weekly = parseTencentPayload(ifzqWeek, 'W');
    expect(weekly.bars.length).toBeGreaterThanOrEqual(5);
    expect(weekly.bars[weekly.bars.length - 1]).toMatchObject({
      time: Date.UTC(2026, 10, 19) / 1000,
      open: 1426.3,
      close: 1453.69,
      high: 1461.6,
      low: 1425,
    });
    const minutes = parseTencentPayload(ifzqMinutes, '5m');
    expect(minutes.bars.length).toBeGreaterThanOrEqual(5);
    const last = minutes.bars[minutes.bars.length - 1];
    expect(last.time).toBe(Date.UTC(2026, 10, 19, 14, 40) / 1000 - 8 * 3600);
    expect(last).toMatchObject({ open: 1452.98, close: 1453.53, high: 1454.93, low: 1452.97, volume: 883 });
  });

  it('parses Eastmoney daily klines and the name on the board snapshot', () => {
    const parsed = parseEastmoneyPayload(eastmoneyDay);
    expect(parsed.bars).toHaveLength(5);
    expect(parsed.bars[0]).toMatchObject({
      time: Date.UTC(2026, 10, 13) / 1000,
      open: 1404,
      close: 1435.26,
      high: 1437.69,
      low: 1394,
      volume: 41780,
    });
    expect(parsed.snapshot.name).toBe('贵州茅台');
    expect(parsed.snapshot.previousClose).toBe(1442.66);
    expect(parsed.snapshot.last).toBe(1454.68);
  });

  it('rejects the broken Tencent US 2-bar history', () => {
    expect(() => parseTencentPayload(tencentUsBad, 'D')).toThrow(QuoteError);
    expect(() => parseTencentPayload(tencentUsBad, 'D')).toThrow(/too few|gap|broken/i);
  });

  it('rejects a huge hole even when five prices exist', () => {
    const day = 86_400;
    const bars = [0, 1, 2, 3, 3 + (2 * 365 + 1)].map((offset, index) => ({
      time: 1_700_000_000 + offset * day,
      open: 10 + index,
      high: 11 + index,
      low: 9 + index,
      close: 10.5 + index,
    }));
    expect(() => assertUsableBars(bars, 'tencent')).toThrow(/gap|broken/i);
  });

  it('prefers Tencent then Eastmoney for an A-share daily request', async () => {
    const tencent = tencentDay;
    const eastmoney = eastmoneyDay;
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('ifzq') || String(url).includes('gtimg')) {
        return new Response(JSON.stringify(tencent), { status: 200 });
      }
      if (String(url).includes('eastmoney')) return new Response(JSON.stringify(eastmoney), { status: 200 });
      return new Response('nope', { status: 503 });
    });
    const quote = await fetchPublicQuote('600519', 'D', fetchImpl as unknown as typeof fetch);
    expect(quote.source).toBe('tencent');
    expect(quote.name).toBe('贵州茅台');
    expect(quote.bars[0].close).toBe(1318.49);
    expect(String(fetchImpl.mock.calls[0][0])).toMatch(/ifzq|gtimg/);
  });

  it('falls through a failed Tencent URL to Eastmoney for A-shares', async () => {
    const eastmoney = eastmoneyDay;
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('eastmoney')) return new Response(JSON.stringify(eastmoney), { status: 200 });
      return new Response('nope', { status: 503 });
    });
    const quote = await fetchPublicQuote('sh600519', 'D', fetchImpl as unknown as typeof fetch);
    expect(quote.source).toBe('eastmoney');
    expect(quote.bars).toHaveLength(5);
    expect(quote.bars[4].close).toBe(1454.68);
  });

  it('tries Eastmoney 105 then 106, then Yahoo, then allorigins for US symbols', async () => {
    const seen: string[] = [];
    const yahooBars = {
      chart: {
        result: [
          {
            meta: { currency: 'USD', shortName: 'Apple Inc.', regularMarketPrice: 15.5, chartPreviousClose: 14.5 },
            timestamp: [1, 2, 3, 4, 5],
            indicators: {
              quote: [{ open: [10, 11, 12, 13, 14], high: [11, 12, 13, 14, 16], low: [9, 10, 11, 12, 13], close: [10.5, 11.5, 12.5, 13.5, 15.5], volume: [1, 1, 1, 1, 2] }],
            },
          },
        ],
        error: null,
      },
    };
    const fetchImpl = vi.fn(async (url: string) => {
      const value = String(url);
      seen.push(value);
      if (value.includes('allorigins.win') && value.includes('AAPL')) {
        return new Response(JSON.stringify(yahooBars), { status: 200 });
      }
      return new Response('nope', { status: 503 });
    });
    const quote = await fetchPublicQuote('AAPL', 'D', fetchImpl as unknown as typeof fetch);
    expect(quote.source).toBe('yahoo-allorigins');
    expect(quote.bars).toHaveLength(5);
    expect(quote.last).toBe(15.5);
    expect(quote.currency).toBe('USD');
    expect(seen.some((url) => url.includes('secid=105.AAPL'))).toBe(true);
    expect(seen.some((url) => url.includes('secid=106.AAPL'))).toBe(true);
    expect(seen.some((url) => url.includes('query1.finance.yahoo.com') && !url.includes('allorigins'))).toBe(true);
    expect(seen.some((url) => url.includes('allorigins.win'))).toBe(true);
    expect(seen.some((url) => url.includes('gtimg') || url.includes('ifzq'))).toBe(false);
  });

  it('uses the prior session close for Yahoo change, not chartPreviousClose', () => {
    const parsed = parseYahooQuote({
      chart: {
        result: [
          {
            meta: {
              currency: 'USD',
              shortName: 'Apple Inc.',
              regularMarketPrice: 352.45,
              chartPreviousClose: 228.02,
              regularMarketPreviousClose: 351.91,
              regularMarketChange: 0.54,
              regularMarketChangePercent: 0.153,
            },
            timestamp: [1, 2, 3, 4, 5],
            indicators: {
              quote: [{
                open: [200, 210, 220, 350, 351.94],
                high: [210, 220, 230, 356, 356.42],
                low: [190, 200, 210, 349, 351.47],
                close: [205, 215, 228.02, 351.91, 352.45],
                volume: [1, 1, 1, 1, 2],
              }],
            },
          },
        ],
        error: null,
      },
    });
    expect(parsed.snapshot.last).toBe(352.45);
    expect(parsed.snapshot.previousClose).toBe(351.91);
    expect(parsed.snapshot.change).toBeCloseTo(0.54, 6);
    expect(parsed.snapshot.changePercent).toBeCloseTo(0.153, 6);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { fetchPublicQuote, keepValidBars, parseStooq, parseYahoo, QuoteError, yahooWindow } from '../src/data/quote.ts';

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
    expect(bars[0]).toMatchObject({ open: 10, high: 12, low: 9, close: 11 });
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

  it('falls through Yahoo to Stooq and surfaces both failures', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('yahoo')) {
        return new Response(JSON.stringify({ chart: { result: null, error: { description: 'No data found' } } }), { status: 200 });
      }
      return new Response('not a table', { status: 200 });
    });
    await expect(fetchPublicQuote('AAPL', 'D', fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({
      reasons: [expect.stringContaining('No data found'), expect.stringContaining('Stooq')],
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
      reasons: [expect.stringContaining('Yahoo'), expect.stringContaining('no intraday')],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('uses Stooq when Yahoo fails and labels the source', async () => {
    const csv = [
      'Date,Open,High,Low,Close,Volume',
      '2024-01-02,10,12,9,11,1',
      '2024-01-03,11,13,10,12,1',
      '2024-01-04,12,14,11,13,1',
      '2024-01-05,13,15,12,14,1',
      '2024-01-08,14,16,13,15,1',
    ].join('\n');
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('yahoo')) return new Response('nope', { status: 503 });
      return new Response(csv, { status: 200 });
    });
    const quote = await fetchPublicQuote('AAPL', 'D', fetchImpl as unknown as typeof fetch);
    expect(quote.source).toBe('stooq');
    expect(quote.bars).toHaveLength(5);
    expect(quote.bars[4].close).toBe(15);
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { PublicQuote } from '../src/data/quote.ts';
import { loadComparison, matchesQuote, type ComparisonRow } from '../src/ui/comparison.ts';

function quote(timeframe: PublicQuote['timeframe'] = 'D', display = '300308'): PublicQuote {
  return { symbol: display, display, market: 'ashare', source: 'tencent', timeframe,
    bars: [{ time: 1_700_000_000, open: 100, close: 101, low: 99, high: 102 }] };
}

describe('independent daily / weekly comparison', () => {
  it('reuses a primary daily quote, fetching only real weekly data', async () => {
    const load = vi.fn(async () => quote('W'));
    const rows: ComparisonRow[] = [];
    await loadComparison(quote(), load, row => rows.push(row), () => true);
    expect(load).toHaveBeenCalledExactlyOnceWith('300308', 'W');
    expect(rows.map(row => [row.timeframe, row.status])).toEqual([['D', 'ready'], ['W', 'loading'], ['W', 'ready']]);
  });
  it('does not resample or relabel a weekly primary as daily', async () => {
    const rows: ComparisonRow[] = [];
    const daily = quote();
    daily.bars[0].time -= 86400 * 300;
    const load = vi.fn(async () => daily);
    await loadComparison(quote('W'), load, row => rows.push(row), () => true);
    const result = rows.find(row => row.timeframe === 'D' && row.status === 'ready');
    expect(result && result.status === 'ready' && result.quote.bars[0].time).toBe(daily.bars[0].time);
    expect(load).toHaveBeenCalledExactlyOnceWith('300308', 'D');
  });
  it('retains primary usability when the secondary request fails', async () => {
    const primary = quote();
    const rows: ComparisonRow[] = [];
    await loadComparison(primary, async () => { throw new Error('offline'); }, row => rows.push(row), () => true);
    expect(rows[0]).toEqual({ timeframe: 'D', status: 'ready', quote: primary });
    expect(rows.at(-1)).toEqual({ timeframe: 'W', status: 'unavailable' });
    expect(primary.timeframe).toBe('D');
  });
  it('rejects mismatched symbols, intervals and invalid bars instead of relabeling data', async () => {
    for (const invalid of [quote('D'), quote('W', 'AAPL'), { ...quote('W'), bars: [] }]) {
      const rows: ComparisonRow[] = [];
      await loadComparison(quote(), async () => invalid, row => rows.push(row), () => true);
      expect(rows.at(-1)?.status).toBe('unavailable');
    }
    expect(matchesQuote(quote(), 'sz300308', 'D')).toBe(true);
    expect(matchesQuote(quote(), '300308', '5m')).toBe(false);
  });
  it('discards both late success and late failure after the active request changes', async () => {
    for (const fail of [false, true]) {
      let current = true;
      let settle!: (value: PublicQuote) => void;
      let reject!: (reason: Error) => void;
      const pending = new Promise<PublicQuote>((resolve, rejectPromise) => { settle = resolve; reject = rejectPromise; });
      const rows: ComparisonRow[] = [];
      const task = loadComparison(quote(), () => pending, row => rows.push(row), () => current);
      current = false;
      const count = rows.length;
      if (fail) reject(new Error('late failure'));
      else settle(quote('W'));
      await task;
      expect(rows).toHaveLength(count);
    }
  });
  it('does no work for an obsolete request and fetches both daily and weekly for intraday', async () => {
    const load = vi.fn(async (_symbol: string, tf: PublicQuote['timeframe']) => quote(tf));
    const publish = vi.fn();
    await loadComparison(quote(), load, publish, () => false);
    expect(load).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
    await loadComparison(quote('5m'), load, publish, () => true);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalledWith('300308', 'D');
    expect(load).toHaveBeenCalledWith('300308', 'W');
  });
});

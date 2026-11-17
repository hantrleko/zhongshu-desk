import type { Bar } from '../engine/types.ts';
import { isIntraday, resampleWeekly, type Timeframe } from './resample.ts';

const SYMBOL = /^[A-Za-z0-9.]{1,15}$/;

/** Yahoo chart interval and range for one chip. Intraday history on that API is short. */
export function yahooWindow(timeframe: Timeframe): { interval: string; range: string } {
  switch (timeframe) {
    case '5m':
      return { interval: '5m', range: '60d' };
    case '15m':
      return { interval: '15m', range: '60d' };
    case '30m':
      return { interval: '30m', range: '60d' };
    case '1h':
      return { interval: '60m', range: '730d' };
    case 'W':
      return { interval: '1wk', range: '5y' };
    case 'D':
      return { interval: '1d', range: '2y' };
  }
}
const TIMEOUT_MS = 8000;

export class QuoteError extends Error {
  readonly reasons: string[];

  constructor(message: string, reasons: string[]) {
    super(message);
    this.name = 'QuoteError';
    this.reasons = reasons;
  }
}

export interface PublicQuote {
  symbol: string;
  source: 'yahoo' | 'stooq';
  timeframe: Timeframe;
  bars: Bar[];
}

export function assertSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  if (!SYMBOL.test(trimmed)) {
    throw new QuoteError('代码只能包含字母、数字和点，最长 15 位。', ['symbol']);
  }
  return trimmed;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Drop bars that are not usable. Do not repair or invent a price. */
export function keepValidBars(bars: readonly Bar[]): Bar[] {
  const sorted = [...bars].sort((a, b) => a.time - b.time);
  const kept: Bar[] = [];
  for (const bar of sorted) {
    if (!finite(bar.time) || !finite(bar.open) || !finite(bar.high) || !finite(bar.low) || !finite(bar.close)) continue;
    if (bar.high < bar.low) continue;
    if (bar.open > bar.high || bar.open < bar.low || bar.close > bar.high || bar.close < bar.low) continue;
    if (kept.length > 0 && bar.time <= kept[kept.length - 1].time) continue;
    kept.push(bar);
  }
  return kept;
}

interface YahooChart {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<Record<string, Array<number | null>>> };
    }> | null;
    error?: { description?: string; code?: string } | null;
  };
}

export function parseYahoo(payload: unknown): Bar[] {
  const body = payload as YahooChart;
  const failure = body?.chart?.error;
  if (failure) {
    throw new QuoteError(failure.description || failure.code || 'Yahoo returned an error.', ['yahoo']);
  }
  const result = body?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];
  if (!timestamps || !quote) throw new QuoteError('Yahoo returned no bars.', ['yahoo']);
  const draft: Bar[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    if (!finite(open) || !finite(high) || !finite(low) || !finite(close) || !finite(timestamps[i])) continue;
    draft.push({ time: timestamps[i], open, high, low, close });
  }
  const bars = keepValidBars(draft);
  if (bars.length < 5) throw new QuoteError('Yahoo returned too few complete bars.', ['yahoo']);
  return bars;
}

export function parseStooq(csv: string): Bar[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2 || !/^date,open,high,low,close/i.test(lines[0])) {
    throw new QuoteError('Stooq did not return a price table.', ['stooq']);
  }
  const draft: Bar[] = [];
  for (const line of lines.slice(1)) {
    const [date, open, high, low, close] = line.split(',');
    if (!date || date.toLowerCase() === 'null') continue;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (!match) continue;
    const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 1000;
    const values = [open, high, low, close].map((item) => Number(item));
    if (values.some((value) => !Number.isFinite(value))) continue;
    draft.push({ time, open: values[0], high: values[1], low: values[2], close: values[3] });
  }
  const bars = keepValidBars(draft);
  if (bars.length < 5) throw new QuoteError('Stooq returned too few complete bars.', ['stooq']);
  return bars;
}

function stooqSymbol(symbol: string): string | null {
  if (symbol.includes('.')) {
    if (symbol.toUpperCase().endsWith('.HK')) return symbol.toLowerCase();
    return null;
  }
  return `${symbol.toLowerCase()}.us`;
}

async function fetchText(url: string, fetchImpl: typeof fetch): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json,text/csv,text/plain' },
    });
    if (!response.ok) throw new QuoteError(`HTTP ${response.status}`, [url]);
    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Best-effort public quote. Yahoo first, then Stooq for US and HK symbols.
 * Throws QuoteError when nothing usable comes back. Never fills in a price.
 */
export async function fetchPublicQuote(
  symbol: string,
  timeframe: Timeframe,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicQuote> {
  const code = assertSymbol(symbol);
  const reasons: string[] = [];
  const span = yahooWindow(timeframe);
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(code)}?interval=${span.interval}&range=${span.range}&includeAdjustedClose=false`;
  try {
    const text = await fetchText(yahooUrl, fetchImpl);
    const bars = parseYahoo(JSON.parse(text) as unknown);
    return { symbol: code, source: 'yahoo', timeframe, bars };
  } catch (error) {
    reasons.push(`Yahoo: ${error instanceof Error ? error.message : 'failed'}`);
  }
  const mapped = stooqSymbol(code);
  if (isIntraday(timeframe)) {
    reasons.push('Stooq: no intraday bars in this adapter. Daily CSV is not relabeled as a finer timeframe.');
  } else if (!mapped) {
    reasons.push('Stooq: this symbol is not mapped. Stooq is only tried for US tickers and .HK.');
  } else {
    try {
      const text = await fetchText(`https://stooq.com/q/d/l/?s=${encodeURIComponent(mapped)}&i=d`, fetchImpl);
      const daily = parseStooq(text);
      const bars = timeframe === 'W' ? resampleWeekly(daily) : daily;
      if (bars.length < 5) throw new QuoteError('Stooq weekly aggregate is too short.', ['stooq']);
      return { symbol: code, source: 'stooq', timeframe, bars };
    } catch (error) {
      reasons.push(`Stooq: ${error instanceof Error ? error.message : 'failed'}`);
    }
  }
  throw new QuoteError('公开行情没有返回可用的 K 线。', reasons);
}

import type { Bar } from '../engine/types.ts';
import { isIntraday, resampleWeekly, type Timeframe } from './resample.ts';

const SYMBOL = /^[A-Za-z0-9.]{1,15}$/;
const TWO_YEARS = 2 * 365 * 24 * 3600;
const TIMEOUT_MS = 8000;
const PROXY_TIMEOUT_MS = 20000;
/** Tencent caps near 800 bars: count=800 returns ~801 rows, larger counts degrade to ~640. */
const TENCENT_HISTORY_BARS = 800;
/** Eastmoney accepts lmt well above this; 1000 stays inside the verified range. */
const EASTMONEY_HISTORY_BARS = 1000;

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

export class QuoteError extends Error {
  readonly reasons: string[];

  constructor(message: string, reasons: string[]) {
    super(message);
    this.name = 'QuoteError';
    this.reasons = reasons;
  }
}

export type QuoteSource = 'tencent' | 'eastmoney' | 'yahoo' | 'yahoo-allorigins' | 'stooq';
export type MarketKind = 'ashare' | 'us' | 'hk' | 'other';

export interface QuoteSnapshot {
  name?: string;
  currency?: string;
  last?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  delayed?: boolean;
}

export interface PublicQuote extends QuoteSnapshot {
  symbol: string;
  display: string;
  market: MarketKind;
  source: QuoteSource;
  timeframe: Timeframe;
  bars: Bar[];
}

export interface SymbolMap {
  input: string;
  display: string;
  market: MarketKind;
  tencent?: string;
  eastmoney: string[];
  yahoo?: string;
  stooq?: string;
  currency?: string;
}

export function isValidSymbol(symbol: string): boolean {
  return SYMBOL.test(symbol.trim());
}

export function assertSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  if (!isValidSymbol(trimmed)) {
    throw new QuoteError('代码只能包含字母、数字和点，最长 15 位。', ['symbol']);
  }
  return trimmed;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function finiteVolume(value: unknown): value is number {
  return finite(value) && value >= 0;
}

function asNumber(value: unknown): number | null {
  if (finite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && value.toLowerCase() !== 'null') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text ? text : undefined;
}

export function mapSymbol(symbol: string): SymbolMap {
  const input = assertSymbol(symbol);
  const upper = input.toUpperCase();
  const lower = input.toLowerCase();

  if (lower === 'sh000001' || upper === '000001.SS') {
    return {
      input,
      display: 'sh000001',
      market: 'ashare',
      tencent: 'sh000001',
      eastmoney: ['1.000001'],
      yahoo: '000001.SS',
      currency: 'CNY',
    };
  }

  const prefixed = /^(sh|sz)(\d{6})$/i.exec(input);
  if (prefixed) {
    return ashareMap(input, prefixed[1].toLowerCase() as 'sh' | 'sz', prefixed[2]);
  }
  const dotted = /^(\d{6})\.(SS|SZ)$/i.exec(input);
  if (dotted) {
    return ashareMap(input, dotted[2].toUpperCase() === 'SS' ? 'sh' : 'sz', dotted[1]);
  }
  if (/^\d{6}$/.test(input)) {
    const head = input[0];
    if (head === '6' || head === '9' || head === '5') return ashareMap(input, 'sh', input);
    if (head === '0' || head === '1' || head === '2' || head === '3') return ashareMap(input, 'sz', input);
  }

  if (upper.endsWith('.HK')) {
    return { input, display: upper, market: 'hk', eastmoney: [], yahoo: upper, stooq: lower, currency: 'HKD' };
  }
  const usPrefixed = /^us([A-Z0-9]{1,10})$/i.exec(input);
  if (usPrefixed) return usMap(input, usPrefixed[1].toUpperCase());
  if (upper.endsWith('.US')) return usMap(input, upper.slice(0, -3));
  if (/^[A-Z]{1,5}$/.test(upper)) return usMap(input, upper);

  return { input, display: upper, market: 'other', eastmoney: [], yahoo: upper };
}

function ashareMap(input: string, exchange: 'sh' | 'sz', digits: string): SymbolMap {
  const tencent = `${exchange}${digits}`;
  const eastmoney = `${exchange === 'sh' ? '1' : '0'}.${digits}`;
  const yahoo = `${digits}.${exchange === 'sh' ? 'SS' : 'SZ'}`;
  return { input, display: digits, market: 'ashare', tencent, eastmoney: [eastmoney], yahoo, currency: 'CNY' };
}

function usMap(input: string, ticker: string): SymbolMap {
  return {
    input,
    display: ticker,
    market: 'us',
    eastmoney: [`105.${ticker}`, `106.${ticker}`],
    yahoo: ticker,
    stooq: `${ticker.toLowerCase()}.us`,
    currency: 'USD',
  };
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
    const next: Bar = { time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
    if (finiteVolume(bar.volume)) next.volume = bar.volume;
    kept.push(next);
  }
  return kept;
}

/**
 * Reject a series that is too short or has a clearly broken multi-year hole.
 * The Tencent US 2-bar 2011+2026 payload is the motivating case.
 */
export function assertUsableBars(bars: readonly Bar[], source: string): Bar[] {
  const kept = keepValidBars(bars);
  if (kept.length < 5) throw new QuoteError(`${source} returned too few complete bars.`, [source]);
  const gaps: number[] = [];
  for (let i = 1; i < kept.length; i += 1) gaps.push(kept[i].time - kept[i - 1].time);
  const ranked = [...gaps].sort((a, b) => a - b);
  const median = ranked[Math.floor(ranked.length / 2)] ?? 0;
  const maxGap = ranked[ranked.length - 1] ?? 0;
  const clearlyBroken = maxGap >= TWO_YEARS && (gaps.length < 4 || maxGap > median * 40);
  if (clearlyBroken) {
    throw new QuoteError(`${source} returned a broken series with a multi-year gap.`, [source]);
  }
  return kept;
}

/** Parse a feed timestamp. Date-only values stay UTC midnight. Intraday clocks are China time (UTC+8). */
export function parseFeedTime(raw: string): number | null {
  const text = raw.trim();
  const compact = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/.exec(text);
  if (compact && text.length >= 8 && !text.includes('-')) {
    const year = Number(compact[1]);
    const month = Number(compact[2]);
    const day = Number(compact[3]);
    if (text.length === 8) return Date.UTC(year, month - 1, day) / 1000;
    if (compact[4] == null || compact[5] == null) return null;
    const hour = Number(compact[4]);
    const minute = Number(compact[5]);
    const second = compact[6] != null ? Number(compact[6]) : 0;
    return Date.UTC(year, month - 1, day, hour, minute, second) / 1000 - 8 * 3600;
  }
  const spaced = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
  if (!spaced) return null;
  const year = Number(spaced[1]);
  const month = Number(spaced[2]);
  const day = Number(spaced[3]);
  if (spaced[4] == null) return Date.UTC(year, month - 1, day) / 1000;
  const hour = Number(spaced[4]);
  const minute = Number(spaced[5]);
  const second = spaced[6] != null ? Number(spaced[6]) : 0;
  return Date.UTC(year, month - 1, day, hour, minute, second) / 1000 - 8 * 3600;
}

function barFromOhlc(time: number, open: unknown, close: unknown, high: unknown, low: unknown, volume?: unknown): Bar | null {
  const o = asNumber(open);
  const c = asNumber(close);
  const h = asNumber(high);
  const l = asNumber(low);
  if (!finite(o) || !finite(c) || !finite(h) || !finite(l)) return null;
  const bar: Bar = { time, open: o, high: h, low: l, close: c };
  const vol = asNumber(volume);
  if (finiteVolume(vol)) bar.volume = vol;
  return bar;
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function firstStockBlock(data: unknown): Record<string, unknown> | null {
  const record = firstRecord(data);
  if (!record) return null;
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
}

function klineKeys(timeframe: Timeframe): string[] {
  switch (timeframe) {
    case 'D':
      return ['qfqday', 'day'];
    case 'W':
      return ['qfqweek', 'week'];
    case '5m':
      return ['m5'];
    case '15m':
      return ['m15'];
    case '30m':
      return ['m30'];
    case '1h':
      return ['m60'];
  }
}

function rowsFromBlock(block: Record<string, unknown>, timeframe: Timeframe): unknown[] | null {
  for (const key of klineKeys(timeframe)) {
    const rows = block[key];
    if (Array.isArray(rows)) return rows;
  }
  return null;
}

export function parseTencentQt(qt: unknown): QuoteSnapshot {
  const record = firstRecord(qt);
  const snapshot: QuoteSnapshot = {};
  if (!record) return snapshot;
  let row: unknown[] | undefined;
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[1] === 'string') {
      row = value;
      break;
    }
  }
  if (!row) return snapshot;
  const name = asText(row[1]);
  if (name) snapshot.name = name;
  const last = asNumber(row[3]);
  const previousClose = asNumber(row[4]);
  const open = asNumber(row[5]);
  const volume = asNumber(row[6]);
  const change = asNumber(row[31]);
  const changePercent = asNumber(row[32]);
  const high = asNumber(row[33]);
  const low = asNumber(row[34]);
  if (finite(last)) snapshot.last = last;
  if (finite(previousClose)) snapshot.previousClose = previousClose;
  if (finite(open)) snapshot.open = open;
  if (finiteVolume(volume)) snapshot.volume = volume;
  if (finite(change)) snapshot.change = change;
  if (finite(changePercent)) snapshot.changePercent = changePercent;
  if (finite(high)) snapshot.high = high;
  if (finite(low)) snapshot.low = low;
  if (asText(row[0])?.toLowerCase().includes('delay')) snapshot.delayed = true;
  const currency = row.find((item) => item === 'CNY' || item === 'USD' || item === 'HKD');
  if (typeof currency === 'string') snapshot.currency = currency;
  return snapshot;
}

export function parseTencentPayload(payload: unknown, timeframe: Timeframe, source = 'tencent'): { bars: Bar[]; snapshot: QuoteSnapshot } {
  const body = firstRecord(payload);
  if (!body) throw new QuoteError('Tencent returned no bars.', [source]);
  if (body.code !== undefined && body.code !== 0 && body.code !== '0') {
    throw new QuoteError(asText(body.msg) || 'Tencent returned an error.', [source]);
  }
  const block = firstStockBlock(body.data);
  if (!block) throw new QuoteError('Tencent returned no bars.', [source]);
  const rows = rowsFromBlock(block, timeframe);
  if (!rows) throw new QuoteError('Tencent returned no bars.', [source]);
  const draft: Bar[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const time = typeof row[0] === 'string' ? parseFeedTime(row[0]) : null;
    if (time == null) continue;
    const bar = barFromOhlc(time, row[1], row[2], row[3], row[4], row[5]);
    if (bar) draft.push(bar);
  }
  const snapshot = parseTencentQt(block.qt);
  return { bars: assertUsableBars(draft, source), snapshot };
}

export function parseEastmoneyPayload(payload: unknown, source = 'eastmoney'): { bars: Bar[]; snapshot: QuoteSnapshot } {
  const body = firstRecord(payload);
  const data = firstRecord(body?.data);
  if (!body || !data) throw new QuoteError('Eastmoney returned no bars.', [source]);
  if (body.rc !== undefined && body.rc !== 0 && body.rc !== '0') {
    throw new QuoteError('Eastmoney returned an error.', [source]);
  }
  const rows = data.klines;
  if (!Array.isArray(rows)) throw new QuoteError('Eastmoney returned no bars.', [source]);
  const draft: Bar[] = [];
  for (const row of rows) {
    if (typeof row !== 'string') continue;
    const parts = row.split(',');
    if (parts.length < 5) continue;
    const time = parseFeedTime(parts[0]);
    if (time == null) continue;
    const bar = barFromOhlc(time, parts[1], parts[2], parts[3], parts[4], parts[5]);
    if (bar) draft.push(bar);
  }
  const bars = assertUsableBars(draft, source);
  const snapshot: QuoteSnapshot = {};
  const name = asText(data.name);
  if (name) snapshot.name = name;
  const previousClose = asNumber(data.prePrice ?? data.preKPrice);
  if (finite(previousClose)) snapshot.previousClose = previousClose;
  const last = bars[bars.length - 1];
  if (last) {
    snapshot.last = last.close;
    snapshot.open = last.open;
    snapshot.high = last.high;
    snapshot.low = last.low;
    if (finiteVolume(last.volume)) snapshot.volume = last.volume;
    if (finite(previousClose)) {
      snapshot.change = last.close - previousClose;
      if (previousClose !== 0) snapshot.changePercent = (snapshot.change / previousClose) * 100;
    }
  }
  return { bars, snapshot };
}

interface YahooChart {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      timestamp?: number[];
      indicators?: { quote?: Array<Record<string, Array<number | null>>> };
    }> | null;
    error?: { description?: string; code?: string } | null;
  };
}

export function parseYahoo(payload: unknown, source = 'yahoo'): Bar[] {
  return parseYahooQuote(payload, source).bars;
}

export function parseYahooQuote(payload: unknown, source = 'yahoo'): { bars: Bar[]; snapshot: QuoteSnapshot } {
  const body = payload as YahooChart;
  const failure = body?.chart?.error;
  if (failure) {
    throw new QuoteError(failure.description || failure.code || 'Yahoo returned an error.', [source]);
  }
  const result = body?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];
  if (!timestamps || !quote) throw new QuoteError('Yahoo returned no bars.', [source]);
  const draft: Bar[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    if (!finite(open) || !finite(high) || !finite(low) || !finite(close) || !finite(timestamps[i])) continue;
    const bar: Bar = { time: timestamps[i], open, high, low, close };
    const volume = quote.volume?.[i];
    if (finiteVolume(volume)) bar.volume = volume;
    draft.push(bar);
  }
  const bars = assertUsableBars(draft, source);
  const meta = result?.meta ?? {};
  const snapshot: QuoteSnapshot = {};
  const name = asText(meta.shortName) ?? asText(meta.longName) ?? asText(meta.symbol);
  if (name) snapshot.name = name;
  const currency = asText(meta.currency);
  if (currency) snapshot.currency = currency;
  const last = asNumber(meta.regularMarketPrice) ?? bars[bars.length - 1]?.close;
  // chartPreviousClose is the close at the start of the requested range, not the prior session.
  const previousClose =
    asNumber(meta.regularMarketPreviousClose) ??
    asNumber(meta.previousClose) ??
    (bars.length >= 2 ? bars[bars.length - 2].close : undefined);
  if (finite(last)) snapshot.last = last;
  if (finite(previousClose)) snapshot.previousClose = previousClose;
  const sessionChange = asNumber(meta.regularMarketChange);
  const sessionPercent = asNumber(meta.regularMarketChangePercent);
  if (finite(sessionChange) && finite(sessionPercent)) {
    snapshot.change = sessionChange;
    snapshot.changePercent = sessionPercent;
  } else if (finite(last) && finite(previousClose)) {
    snapshot.change = last - previousClose;
    if (previousClose !== 0) snapshot.changePercent = (snapshot.change / previousClose) * 100;
  }
  const lastBar = bars[bars.length - 1];
  if (lastBar) {
    snapshot.open = lastBar.open;
    snapshot.high = lastBar.high;
    snapshot.low = lastBar.low;
    if (finiteVolume(lastBar.volume)) snapshot.volume = lastBar.volume;
  }
  return { bars, snapshot };
}

export function parseStooq(csv: string): Bar[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2 || !/^date,open,high,low,close/i.test(lines[0])) {
    throw new QuoteError('Stooq did not return a price table.', ['stooq']);
  }
  const header = lines[0].split(',').map((item) => item.trim().toLowerCase());
  const volumeIndex = header.indexOf('volume');
  const draft: Bar[] = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(',');
    const date = parts[0];
    const open = parts[1];
    const high = parts[2];
    const low = parts[3];
    const close = parts[4];
    if (!date || date.toLowerCase() === 'null') continue;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (!match) continue;
    const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 1000;
    const values = [open, high, low, close].map((item) => Number(item));
    if (values.some((value) => !Number.isFinite(value))) continue;
    const bar: Bar = { time, open: values[0], high: values[1], low: values[2], close: values[3] };
    if (volumeIndex >= 0) {
      const volume = asNumber(parts[volumeIndex]);
      if (finiteVolume(volume)) bar.volume = volume;
    }
    draft.push(bar);
  }
  return assertUsableBars(draft, 'stooq');
}

function snapshotFromBars(bars: Bar[], snapshot: QuoteSnapshot, fallbackCurrency?: string): QuoteSnapshot {
  const last = bars[bars.length - 1];
  const prior = bars.length >= 2 ? bars[bars.length - 2] : undefined;
  const next: QuoteSnapshot = { ...snapshot };
  if (last) {
    if (!finite(next.last)) next.last = last.close;
    if (!finite(next.open)) next.open = last.open;
    if (!finite(next.high)) next.high = last.high;
    if (!finite(next.low)) next.low = last.low;
    if (!finiteVolume(next.volume) && finiteVolume(last.volume)) next.volume = last.volume;
    if (!finite(next.previousClose) && prior) next.previousClose = prior.close;
    if (!finite(next.change) && finite(next.last) && finite(next.previousClose)) next.change = next.last - next.previousClose;
    if (!finite(next.changePercent) && finite(next.change) && finite(next.previousClose) && next.previousClose !== 0) {
      next.changePercent = (next.change / next.previousClose) * 100;
    }
  }
  if (!next.currency && fallbackCurrency) next.currency = fallbackCurrency;
  return next;
}

function finishQuote(
  mapped: SymbolMap,
  source: QuoteSource,
  timeframe: Timeframe,
  bars: Bar[],
  snapshot: QuoteSnapshot,
): PublicQuote {
  return {
    symbol: mapped.display,
    display: mapped.display,
    market: mapped.market,
    source,
    timeframe,
    bars,
    ...snapshotFromBars(bars, snapshot, mapped.currency),
  };
}

async function fetchText(url: string, fetchImpl: typeof fetch, timeoutMs = TIMEOUT_MS): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json,text/csv,text/plain' },
    });
    if (!response.ok) throw new QuoteError(`HTTP ${response.status}`, [url]);
    return response.text();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new QuoteError(`timed out after ${timeoutMs / 1000}s`, [url]);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, fetchImpl: typeof fetch, timeoutMs = TIMEOUT_MS): Promise<unknown> {
  const text = await fetchText(url, fetchImpl, timeoutMs);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new QuoteError('Response was not JSON.', [url]);
  }
}

export function tencentUrls(tencentCode: string, timeframe: Timeframe): string[] {
  const count = TENCENT_HISTORY_BARS;
  if (timeframe === 'D') {
    return [
      `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tencentCode},day,,,${count},qfq`,
      `https://ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tencentCode},day,,,${count},qfq`,
    ];
  }
  if (timeframe === 'W') {
    return [`https://ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tencentCode},week,,,${count},qfq`];
  }
  const minutes = timeframe === '5m' ? 'm5' : timeframe === '15m' ? 'm15' : timeframe === '30m' ? 'm30' : 'm60';
  return [`https://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${tencentCode},${minutes},,${count}`];
}

export function eastmoneyUrl(secid: string, timeframe: Timeframe): string {
  const klt = timeframe === 'D' ? 101 : timeframe === 'W' ? 102 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : timeframe === '30m' ? 30 : 60;
  return `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${encodeURIComponent(secid)}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${klt}&fqt=1&end=20500101&lmt=${EASTMONEY_HISTORY_BARS}`;
}

export function yahooUrl(symbol: string, timeframe: Timeframe): string {
  const span = yahooWindow(timeframe);
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${span.interval}&range=${span.range}&includeAdjustedClose=false`;
}

export function allOriginsUrl(target: string): string {
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
}

function reasonOf(label: string, error: unknown): string {
  return `${label}: ${error instanceof Error ? error.message : 'failed'}`;
}

/**
 * Best-effort public quote for A-shares and US stocks (HK still tried on Yahoo/Stooq).
 * Throws QuoteError when nothing usable comes back. Never fills in a price.
 * Teaching fixtures are not an automatic fallback.
 */
export async function fetchPublicQuote(
  symbol: string,
  timeframe: Timeframe,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicQuote> {
  const mapped = mapSymbol(symbol);
  const reasons: string[] = [];

  if (mapped.market === 'ashare' && mapped.tencent) {
    for (const url of tencentUrls(mapped.tencent, timeframe)) {
      try {
        const parsed = parseTencentPayload(await fetchJson(url, fetchImpl), timeframe, 'tencent');
        return finishQuote(mapped, 'tencent', timeframe, parsed.bars, parsed.snapshot);
      } catch (error) {
        reasons.push(reasonOf('Tencent', error));
      }
    }
  }

  for (const secid of mapped.eastmoney) {
    try {
      const parsed = parseEastmoneyPayload(await fetchJson(eastmoneyUrl(secid, timeframe), fetchImpl), 'eastmoney');
      return finishQuote(mapped, 'eastmoney', timeframe, parsed.bars, parsed.snapshot);
    } catch (error) {
      reasons.push(reasonOf(`Eastmoney ${secid}`, error));
    }
  }

  if (mapped.yahoo) {
    const direct = yahooUrl(mapped.yahoo, timeframe);
    try {
      const parsed = parseYahooQuote(await fetchJson(direct, fetchImpl), 'yahoo');
      return finishQuote(mapped, 'yahoo', timeframe, parsed.bars, parsed.snapshot);
    } catch (error) {
      reasons.push(reasonOf('Yahoo', error));
    }
    try {
      const parsed = parseYahooQuote(await fetchJson(allOriginsUrl(direct), fetchImpl, PROXY_TIMEOUT_MS), 'yahoo-allorigins');
      return finishQuote(mapped, 'yahoo-allorigins', timeframe, parsed.bars, parsed.snapshot);
    } catch (error) {
      reasons.push(reasonOf('Yahoo via allorigins', error));
    }
  }

  if (isIntraday(timeframe)) {
    reasons.push('Stooq: no intraday bars in this adapter. Daily CSV is not relabeled as a finer timeframe.');
  } else if (!mapped.stooq) {
    reasons.push('Stooq: this symbol is not mapped. Stooq is only tried for US tickers and .HK.');
  } else {
    try {
      const text = await fetchText(`https://stooq.com/q/d/l/?s=${encodeURIComponent(mapped.stooq)}&i=d`, fetchImpl, PROXY_TIMEOUT_MS);
      const daily = parseStooq(text);
      const bars = timeframe === 'W' ? assertUsableBars(resampleWeekly(daily), 'stooq') : daily;
      return finishQuote(mapped, 'stooq', timeframe, bars, {});
    } catch (error) {
      reasons.push(reasonOf('Stooq', error));
    }
  }

  throw new QuoteError('公开行情没有返回可用的 K 线。', reasons);
}

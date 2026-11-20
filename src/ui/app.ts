import { buildResearch } from './research.ts';
import { researchCopy, researchCommentary, scenarioText, trendTitle, levelPosition, rangeAssessment } from './research-copy.ts';
import { loadComparison, matchesQuote, type ComparisonRow } from './comparison.ts';
import { DeskChart, structureSwingLabels } from '../chart/desk-chart.ts';
import type { ChartLabels } from '../chart/hub-primitive.ts';
import { computeMacd, computeSma, volumePoints } from '../data/indicators.ts';
import { applyTimeframe, type Timeframe } from '../data/resample.ts';
import {
  applyLayerVisibility,
  canSelectTimeframe,
  emptyHubReason,
  lastBarClock,
  resolveShownTimeframe,
} from './clarity.ts';
import { fixtureById, fixtures, type Fixture } from '../data/fixtures.ts';
import {
  fetchPublicQuote,
  isValidSymbol,
  mapSymbol,
  QuoteError,
  type MarketKind,
  type PublicQuote,
  type QuoteSource,
} from '../data/quote.ts';
import { analyze } from '../engine/analyze.ts';
import { priceBand } from '../engine/readout.ts';
import type { Analysis, Bar, Hub, HubLevel, Mark } from '../engine/types.ts';
import { formatChange, formatDayNowrap, formatDayRange, formatPercent, formatPrice, formatVolume } from '../format.ts';
import { copy, type Lang, type ReadingInput } from '../i18n.ts';

interface LiveSource {
  symbol: string;
  source: QuoteSource;
  name?: string;
}

interface WatchSnapshot {
  name?: string;
  last?: number;
  changePercent?: number;
}

const SYMBOL_STORAGE_KEY = 'zhongshu-desk:symbol';
const DEFAULT_SYMBOL = '300308';

const WATCH_NAMES: Record<string, string> = {
  '300308': '中际旭创',
  '600519': '贵州茅台',
  '000001': '平安银行',
  '300750': '宁德时代',
  '688772': '珠海冠宇',
};

const WATCHLIST: Array<{ symbol: string; market: MarketKind }> = [
  { symbol: '300308', market: 'ashare' },
  { symbol: '600519', market: 'ashare' },
  { symbol: '000001', market: 'ashare' },
  { symbol: '300750', market: 'ashare' },
  { symbol: '688772', market: 'ashare' },
  { symbol: 'AAPL', market: 'us' },
  { symbol: 'MSFT', market: 'us' },
  { symbol: 'NVDA', market: 'us' },
  { symbol: 'TSLA', market: 'us' },
];

function readStoredSymbol(): string {
  try {
    return localStorage.getItem(SYMBOL_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

function persistDisplaySymbol(symbol: string): void {
  try {
    localStorage.setItem(SYMBOL_STORAGE_KEY, symbol);
  } catch {
    // Private mode or a blocked store should not stop the quote from loading.
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('symbol', symbol);
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Ignore if the history API is unavailable.
  }
}

export function bootSymbol(
  search = typeof window === 'undefined' ? '' : window.location.search,
  stored = typeof window === 'undefined' ? '' : readStoredSymbol(),
): string {
  const fromUrl = new URLSearchParams(search).get('symbol')?.trim() ?? '';
  if (isValidSymbol(fromUrl)) return fromUrl;
  if (isValidSymbol(stored)) return stored;
  return DEFAULT_SYMBOL;
}

const MA_LINES = [
  { period: 5, color: '#e6d7a8' },
  { period: 10, color: '#5b8def' },
  { period: 20, color: '#c084fc' },
] as const;

function must<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

function element(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function sourceName(source: QuoteSource): string {
  switch (source) {
    case 'tencent':
      return 'Tencent';
    case 'eastmoney':
      return 'Eastmoney';
    case 'yahoo':
      return 'Yahoo';
    case 'yahoo-allorigins':
      return 'Yahoo / allorigins';
    case 'stooq':
      return 'Stooq';
  }
}

export function startDesk(): void {
  const quoteForm = must<HTMLFormElement>('quote-form');
  const customSymbol = must<HTMLInputElement>('custom-symbol');
  const langButton = must<HTMLButtonElement>('lang');
  const methodsButton = must<HTMLButtonElement>('methods-open');
  const methodsClose = must<HTMLButtonElement>('methods-close');
  const dialog = must<HTMLDialogElement>('methods');
  const methodsTitle = must<HTMLHeadingElement>('methods-title');
  const methodsBody = must<HTMLElement>('methods-body');
  const chartHost = must<HTMLElement>('chart');
  const banner = must<HTMLElement>('banner');
  const studyTitle = must<HTMLElement>('study-title');
  const stageReading = must<HTMLElement>('stage-reading');
  const studyBlurb = must<HTMLElement>('study-blurb');
  const sourceLine = must<HTMLElement>('source-line');
  const timeframeLine = must<HTMLElement>('timeframe-line');
  const freshnessLine = must<HTMLElement>('freshness-line');
  const levelNote = must<HTMLElement>('level-note');
  const legend = must<HTMLElement>('chart-legend');
  const structureCount = must<HTMLElement>('structure-count');
  const levelBi = must<HTMLButtonElement>('level-bi');
  const levelSeg = must<HTMLButtonElement>('level-seg');
  const fitAll = must<HTMLButtonElement>('fit-all');
  const layerAll = must<HTMLButtonElement>('layer-all');
  const layerNone = must<HTMLButtonElement>('layer-none');
  const layerBi = must<HTMLButtonElement>('layer-bi');
  const layerSeg = must<HTMLButtonElement>('layer-seg');
  const layerZs = must<HTMLButtonElement>('layer-zs');
  const layerBsp = must<HTMLButtonElement>('layer-bsp');
  const layerMa = must<HTMLButtonElement>('layer-ma');
  const marketA = must<HTMLButtonElement>('market-ashare');
  const marketUs = must<HTMLButtonElement>('market-us');
  const watchItems = must<HTMLElement>('watch-items');
  const quoteBoard = must<HTMLElement>('quote-board');
  const tfButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tf]'));
  const callout = must<HTMLElement>('callout');
  const hubList = must<HTMLElement>('hub-list');
  const selectStatus = must<HTMLElement>('select-status');
  const footerChart = must<HTMLElement>('footer-chart');
  const footerAdvice = must<HTMLElement>('footer-advice');
  const desk = must<HTMLElement>('desk');
  const tabChart = must<HTMLButtonElement>('tab-chart');
  const tabWatch = must<HTMLButtonElement>('tab-watch');
  const tabDock = must<HTMLButtonElement>('tab-dock');
  const stage = must<HTMLElement>('chart').closest('section');

  let lang: Lang = 'zh';
  const fixtureId = fixtures[0].id;
  let live: LiveSource | null = null;
  let lastQuote: PublicQuote | null = null;
  let market: MarketKind = 'ashare';
  let timeframe: Timeframe = 'D';
  let level: HubLevel = 'bi';
  let layers = { bi: true, seg: true, zs: true, bsp: true };
  let showMa = true;
  let selectedId: string | null = null;
  let rawBars: Bar[] = [];
  let shownBars: Bar[] = [];
  let analysis: Analysis = analyze(rawBars);
  let requestSerial = 0;
  let fitNext = true;
  let failedSymbol: string | null = null;
  let comparisonRows: ComparisonRow[] = [];
  let selectedLevel: string | null = null;
  let mobilePanel: 'chart' | 'watch' | 'dock' = 'chart';
  const watchCache = new Map<string, WatchSnapshot>();

  const chart = new DeskChart(chartHost, (id) => {
    selectedId = selectedId === id ? null : id;
    paint(false);
    const hub = activeHubs().find((item) => item.id === selectedId);
    if (hub) chart.reveal(hub.startTime, hub.endTime);
    announce();
  });

  function text(): ReturnType<typeof copy> {
    return copy(lang);
  }

  function activeHubs(): Hub[] {
    return level === 'bi' ? analysis.biHubs : analysis.segmentHubs;
  }

  function activeMarks(): Mark[] {
    return level === 'bi' ? analysis.biMarks : analysis.segmentMarks;
  }

  function currentFixture(): Fixture {
    return fixtureById(fixtureId) ?? fixtures[0];
  }

  function shownTimeframe(): Timeframe {
    const shown = resolveShownTimeframe(timeframe, live !== null);
    timeframe = shown;
    return shown;
  }

  function timeframeWords(tf: Timeframe, ui: ReturnType<typeof copy>): string {
    if (tf === 'D') return ui.tfD;
    if (tf === 'W') return ui.tfW;
    return tf;
  }

  function adoptLesson(nextRaw: Bar[], fit: boolean): void {
    live = null;
    lastQuote = null;
    shownTimeframe();
    useBars(nextRaw, fit);
  }

  function loadLesson(): void {
    requestSerial += 1;
    comparisonRows = [];
    failedSymbol = null;
    notice = { kind: 'none' };
    adoptLesson(currentFixture().bars, true);
  }

  function labels(): ChartLabels {
    const ui = text();
    return {
      latest: ui.latestTag,
      selected: ui.selectedTag,
      zg: ui.zg,
      zd: ui.zd,
      buy: ui.buy,
      sell: ui.sell,
      hub: ui.hubLabel,
      stroke: ui.strokeLabel,
      segment: ui.segmentLabel,
    };
  }

  function applyStaticCopy(): void {
    const ui = text();
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    document.title = lang === 'zh' ? '中枢台' : 'Zhongshu Desk';
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      if (!key) return;
      const value = ui[key as keyof typeof ui];
      if (typeof value === 'string') node.textContent = value;
    });
    langButton.textContent = ui.langButton;
    langButton.setAttribute('aria-label', ui.langLabel);
    methodsButton.textContent = ui.methods;
    methodsClose.textContent = ui.close;
    fitAll.textContent = ui.fitAll;
    fitAll.title = ui.fitAllTip;
    must<HTMLButtonElement>('quote-submit').textContent = ui.read;
    customSymbol.placeholder = ui.placeholder;
    marketA.textContent = ui.marketA;
    marketUs.textContent = ui.marketUs;
    marketA.parentElement?.setAttribute('aria-label', ui.marketGroup);
    tabChart.textContent = ui.tabChart;
    tabWatch.textContent = ui.tabWatch;
    tabDock.textContent = ui.tabDock;
    const skip = document.querySelector('.skip');
    if (skip) skip.textContent = ui.skip;
    layerBi.textContent = ui.layerBi;
    layerSeg.textContent = ui.layerSeg;
    layerZs.textContent = ui.layerZs;
    layerBsp.textContent = ui.layerBsp;
    layerBi.title = ui.tipBi;
    layerSeg.title = ui.tipSeg;
    layerZs.title = ui.tipZs;
    layerBsp.title = ui.tipBsp;
    layerBi.setAttribute('aria-label', ui.tipBi);
    layerSeg.setAttribute('aria-label', ui.tipSeg);
    layerZs.setAttribute('aria-label', ui.tipZs);
    layerBsp.setAttribute('aria-label', ui.tipBsp);
    levelBi.title = ui.tipLevelBi;
    levelSeg.title = ui.tipLevelSeg;
    footerAdvice.textContent = ui.advice;
    const link = document.createElement('a');
    link.href = 'https://www.tradingview.com/';
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.textContent = ui.footerName;
    footerChart.replaceChildren(document.createTextNode(ui.footerBefore), link, document.createTextNode(ui.footerAfter));
    if (dialog.open) renderMethods();
  }

  function renderMethods(): void {
    const ui = text();
    methodsTitle.textContent = ui.methodsTitle;
    methodsBody.replaceChildren();
    for (const section of ui.methodSections) {
      methodsBody.append(element('h3', undefined, section.heading));
      for (const paragraph of section.paragraphs) methodsBody.append(element('p', undefined, paragraph));
    }
    methodsBody.append(element('h3', undefined, ui.legend));
    const list = document.createElement('ul');
    list.className = 'legend methods-legend';
    list.setAttribute('aria-label', ui.legend);
    for (const item of legendItems(ui)) list.append(legendItem(item));
    methodsBody.append(list);
  }

  type Notice =
    | { kind: 'none' }
    | { kind: 'loading'; symbol: string; timeframe: Timeframe }
    | { kind: 'fail'; headline: 'quote' | 'bad' | 'empty' | 'raw'; reasons: string[] };

  let notice: Notice = { kind: 'none' };

  function renderBanner(): void {
    const ui = text();
    if (notice.kind === 'none') {
      banner.hidden = true;
      banner.replaceChildren();
      banner.classList.remove('is-error');
      return;
    }
    banner.hidden = false;
    banner.classList.toggle('is-error', notice.kind === 'fail');
    const lines: string[] = [];
    if (notice.kind === 'loading') lines.push(ui.loading(notice.symbol, timeframeWords(notice.timeframe, ui)));
    if (notice.kind === 'fail') {
      if (notice.headline === 'quote') lines.push(ui.quoteFail);
      if (notice.headline === 'bad') lines.push(ui.badSymbol);
      if (notice.headline === 'empty') lines.push(ui.emptySymbol);
      if (notice.headline === 'raw') lines.push(lang === 'zh' ? '当前数据未通过结构校验，暂不更新研判。' : 'The data failed structure validation; the assessment was not updated.');

    }
    banner.replaceChildren(...lines.filter(Boolean).map((line) => element('p', undefined, line)));
    if (notice.kind === 'fail' && notice.reasons.length) {
      const details = document.createElement('details');
      details.className = 'source-errors';
      details.append(element('summary', undefined, lang === 'zh' ? '数据源返回明细' : 'Source diagnostics'));
      for (const reason of notice.reasons) details.append(element('p', undefined, reason));
      banner.append(details);
    }
    if (notice.kind === 'fail' && notice.headline === 'quote') {
      const actions = element('div', 'banner-actions');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = ui.loadLesson;
      button.addEventListener('click', () => loadLesson());
      actions.append(button);
      banner.append(actions);
    }
  }

  function useBars(nextRaw: Bar[], fit: boolean): void {
    rawBars = nextRaw;
    // Public quotes already carry the requested interval; only lessons are resampled.
    shownBars = live ? rawBars.map(bar => ({ ...bar })) : applyTimeframe(rawBars, shownTimeframe());
    chart.setReferenceLevel();
    selectedLevel = null;
    try {
      analysis = analyze(shownBars);
    } catch (error) {
      notice = { kind: 'fail', headline: 'raw', reasons: [error instanceof Error ? error.message : 'failed'] };
      renderBanner();
      return;
    }
    if (selectedId && !activeHubs().some((hub) => hub.id === selectedId)) selectedId = null;
    fitNext = fit;
    paint(false);
  }

  function renderProvenance(): void {
    const ui = text();
    const shown = shownTimeframe();
    const requested = timeframeWords(shown, ui);
    if (failedSymbol && shownBars.length === 0) {
      sourceLine.textContent = ui.fallbackLesson(failedSymbol);
    } else if (shownBars.length === 0) {
      sourceLine.textContent = ui.emptyQuote;
    } else {
      const source = live
        ? `${ui.provenanceQuote} · ${sourceName(live.source)} · ${live.symbol}${lastQuote?.name ? ` · ${lastQuote.name}` : ''}`
        : ui.provenanceLesson;
      const stamp = lastBarClock(shownBars[shownBars.length - 1], shown);
      const freshnessParts: string[] = [];
      if (stamp) freshnessParts.push(ui.lastBar(stamp));
      freshnessParts.push(ui.notRealtime);
      if (live) freshnessParts.push(lastQuote?.delayed ? ui.delayedYes : ui.maybeDelayed);
      else freshnessParts.push(ui.teachingPrices);
      sourceLine.textContent = [source, ui.timeframeLine(requested, requested), freshnessParts.join(' · ')].filter(Boolean).join(' · ');
    }
    timeframeLine.textContent = '';
    freshnessLine.textContent = '';
  }

  type LegendItem = { swatch: string; color?: string; text: string; mark?: string };

  function legendItems(ui: ReturnType<typeof copy>, compact = false): LegendItem[] {
    const items: LegendItem[] = [
      { swatch: 'swatch', color: '#f3f4f6', text: ui.legendBi },
      { swatch: 'swatch is-dashed', color: '#f3f4f6', text: ui.legendBiOpen },
      { swatch: 'swatch', color: '#5b8def', text: ui.legendSeg },
      { swatch: 'swatch is-dashed', color: '#5b8def', text: ui.legendSegOpen },
      { swatch: 'swatch is-hub', text: ui.legendZs },
      { swatch: 'swatch is-mark', text: ui.buy, mark: ui.buy },
      { swatch: 'swatch is-mark', text: ui.sell, mark: ui.sell },
    ];
    if (showMa) items.push({ swatch: 'swatch', color: '#e6d7a8', text: ui.legendMa });
    if (volumePoints(shownBars).length > 0) items.push({ swatch: 'swatch', color: '#26c6b0', text: ui.legendVol });
    if (computeMacd(shownBars).length > 0) {
      items.push({ swatch: 'swatch', color: '#d6c07a', text: compact ? ui.legendMacdShort : ui.legendMacd });
    }
    return items;
  }

  function legendItem(item: LegendItem): HTMLLIElement {
    const row = document.createElement('li');
    const sample = document.createElement('span');
    sample.className = item.swatch;
    sample.setAttribute('aria-hidden', 'true');
    if (item.color) sample.style.color = item.color;
    if (item.mark) sample.textContent = item.mark === text().buy ? '↑' : '↓';
    row.append(sample, document.createTextNode(item.text));
    return row;
  }

  function renderLegend(): void {
    const ui = text();
    legend.setAttribute('aria-label', ui.legend);
    legend.replaceChildren();
    for (const item of legendItems(ui, true)) legend.append(legendItem(item));
  }

  function toneClass(value: number | undefined): string {
    if (!Number.isFinite(value) || value === 0 || value === undefined) return '';
    return value > 0 ? 'is-up' : 'is-down';
  }

  function renderWatchlist(): void {
    const active = live?.symbol ?? (shownBars.length && !live ? '' : '');
    const current = live?.symbol ?? customSymbol.value.trim().toUpperCase();
    watchItems.replaceChildren();
    for (const item of WATCHLIST) {
      if (market !== 'other' && item.market !== market) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'watch-item';
      const mapped = mapSymbol(item.symbol);
      const snapshot = watchCache.get(mapped.display) ?? watchCache.get(item.symbol);
      if (live && (live.symbol === mapped.display || live.symbol === item.symbol || current === mapped.display)) {
        button.classList.add('is-active');
      }
      void active;
      const code = element('span', 'watch-code', mapped.display);
      const change = document.createElement('span');
      change.className = `watch-change ${toneClass(snapshot?.changePercent)}`;
      change.textContent = snapshot && Number.isFinite(snapshot.changePercent) ? formatPercent(snapshot.changePercent as number) : '';
      button.append(code, change);
      const name = snapshot?.name ?? WATCH_NAMES[mapped.display] ?? WATCH_NAMES[item.symbol];
      if (name) button.append(element('span', 'watch-name', name));
      button.addEventListener('click', () => {
        customSymbol.value = item.symbol;
        void loadLive(item.symbol);
      });
      watchItems.append(button);
    }
  }

  function quoteField(term: string, value: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.append(element('dt', undefined, term), element('dd', undefined, value));
    return wrap;
  }

  function renderQuoteBoard(): void {
    const ui = text();
    quoteBoard.replaceChildren();
    if (!lastQuote || !live) {
      const empty = element('div', 'empty-quote');
      empty.append(element('p', 'meta', shownBars.length === 0 ? ui.emptyQuote : ui.teachingPrices));
      quoteBoard.append(empty);
      return;
    }
    const quote = lastQuote;
    const head = element('div', 'quote-head');
    const title = [quote.display, quote.name].filter(Boolean).join(' · ');
    head.append(element('strong', undefined, title));
    quoteBoard.append(head);
    if (Number.isFinite(quote.last)) {
      const last = element('div', `quote-last ${toneClass(quote.change)}`, formatPrice(quote.last as number));
      quoteBoard.append(last);
    }
    const grid = document.createElement('dl');
    grid.className = 'quote-grid';
    if (quote.change !== undefined && quote.changePercent !== undefined) {
      grid.append(quoteField(ui.fieldChange, `${formatChange(quote.change)}  ${formatPercent(quote.changePercent)}`));
    }
    if (quote.open !== undefined) grid.append(quoteField(ui.fieldOpen, formatPrice(quote.open)));
    if (quote.high !== undefined) grid.append(quoteField(ui.fieldHigh, formatPrice(quote.high)));
    if (quote.low !== undefined) grid.append(quoteField(ui.fieldLow, formatPrice(quote.low)));
    const close = quote.bars[quote.bars.length - 1]?.close;
    if (close !== undefined) grid.append(quoteField(ui.fieldClose, formatPrice(close)));
    if (quote.volume !== undefined) grid.append(quoteField(ui.fieldVolume, formatVolume(quote.volume)));
    if (quote.currency) grid.append(quoteField(ui.fieldCurrency, quote.currency));
    grid.append(quoteField(ui.fieldSource, sourceName(quote.source)));
    const stamp = lastBarClock(quote.bars[quote.bars.length - 1], quote.timeframe);
    if (stamp) {
      const dateField = quoteField(ui.fieldTime, stamp);
      dateField.className = 'quote-stamp';
      grid.append(dateField);
    }
    grid.append(quoteField(ui.fieldDelay, quote.delayed ? ui.delayedYes : ui.delayedUnknown));
    quoteBoard.append(grid);
  }

  function paint(announceSelection: boolean): void {
    renderBanner();
    const ui = text();
    const fixture = currentFixture();
    const hubs = activeHubs();
    const marks = activeMarks();
    const latest = hubs[hubs.length - 1];
    const reading = readingInput(latest);
    studyTitle.textContent = live ? [live.symbol, lastQuote?.name ?? live.name].filter(Boolean).join(' · ') : fixture.title[lang];
    stageReading.textContent = shownBars.length ? ui.stageReading(reading) : ui.emptyQuote;
    must<HTMLElement>('toolbar-context').textContent = `${timeframeWords(timeframe, ui)} · ${lang === 'zh' ? '价格结构研究' : 'Price structure research'}`;
    studyBlurb.textContent = live ? ui.liveBlurb : shownBars.length === 0 ? ui.emptyQuote : fixture.blurb[lang];
    renderProvenance();
    renderLegend();
    renderWatchlist();
    renderQuoteBoard();
    levelNote.textContent =
      shownBars.length === 0
        ? ''
        : level === 'bi'
          ? ui.levelNoteBi
          : analysis.segmentHubs.length === 0
            ? ui.levelNoteSegEmpty
            : ui.levelNoteSeg;
    structureCount.textContent =
      shownBars.length === 0
        ? ''
        : ui.counts(shownBars.length, analysis.bi.length, analysis.segments.length, hubs.length, marks.length);
    levelBi.textContent = `${ui.levelBi} ${analysis.biHubs.length}`;
    levelSeg.textContent = `${ui.levelSeg} ${analysis.segmentHubs.length}`;
    levelBi.setAttribute('aria-label', `${ui.levelBi} ${analysis.biHubs.length}. ${ui.tipLevelBi}`);
    levelSeg.setAttribute('aria-label', `${ui.levelSeg} ${analysis.segmentHubs.length}. ${ui.tipLevelSeg}`);
    layerAll.textContent = ui.showAll;
    layerNone.textContent = ui.hideAll;
    layerMa.textContent = ui.maLayer;
    const shown = shownTimeframe();
    for (const button of tfButtons) {
      const tf = button.dataset.tf;
      if (tf === 'D') button.textContent = ui.tfD;
      if (tf === 'W') button.textContent = ui.tfW;
      const allowed =
        tf === '5m' || tf === '15m' || tf === '30m' || tf === '1h' || tf === 'D' || tf === 'W'
          ? canSelectTimeframe(tf, live !== null)
          : false;
      button.setAttribute('aria-pressed', tf === shown ? 'true' : 'false');
      if (!allowed) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        button.title = ui.intradayDisabled;
      } else {
        button.disabled = false;
        button.removeAttribute('aria-disabled');
        button.removeAttribute('title');
      }
    }
    layerBi.setAttribute('aria-pressed', layers.bi ? 'true' : 'false');
    layerSeg.setAttribute('aria-pressed', layers.seg ? 'true' : 'false');
    layerZs.setAttribute('aria-pressed', layers.zs ? 'true' : 'false');
    layerBsp.setAttribute('aria-pressed', layers.bsp ? 'true' : 'false');
    layerMa.setAttribute('aria-pressed', showMa ? 'true' : 'false');
    levelBi.setAttribute('aria-pressed', level === 'bi' ? 'true' : 'false');
    levelSeg.setAttribute('aria-pressed', level === 'segment' ? 'true' : 'false');
    marketA.setAttribute('aria-pressed', market === 'ashare' ? 'true' : 'false');
    marketUs.setAttribute('aria-pressed', market === 'us' ? 'true' : 'false');
    chartHost.setAttribute('aria-label', ui.chartSummary(studyTitle.textContent || '', hubs.length));
    stage?.setAttribute('aria-label', lang === 'zh' ? '走势图' : 'Chart');
    chart.setLocale(lang === 'zh' ? 'zh-Hans' : 'en-US');
    const visible = applyLayerVisibility(layers, {
      bi: analysis.bi,
      segments: analysis.segments,
      hubs,
      marks,
    });
    chart.setSeries({
      bars: shownBars,
      bi: visible.bi,
      segments: visible.segments,
      fit: fitNext,
      ma: showMa
        ? MA_LINES.map((line) => ({ period: line.period, color: line.color, points: computeSma(shownBars, line.period) }))
        : [],
      volume: volumePoints(shownBars),
      macd: computeMacd(shownBars),
    });
    fitNext = false;
    const labelSet = labels();
    chart.setOverlay({
      hubs: visible.hubs,
      marks: visible.marks,
      selectedId,
      labels: labelSet,
      fontFamily: getComputedStyle(document.body).fontFamily || 'sans-serif',
      swings: structureSwingLabels(visible.bi, visible.segments, labelSet),
    });
    renderState(latest, reading);
    renderResearch(latest);
    renderComparison();
    renderList(hubs, marks);
    if (stage) stage.setAttribute('aria-busy', 'false');
    if (announceSelection) announce();
  }

  function renderResearch(latest: Hub | undefined): void {
    const c = researchCopy(lang);
    const provisional = latest ? (level === 'bi'
      ? latest.memberIds.includes(analysis.bi.at(-1)?.id ?? '')
      : analysis.segments.some(segment => latest.memberIds.includes(segment.id) && !segment.finished)) : false;
    const r = buildResearch(shownBars, latest, provisional);
    must<HTMLElement>('research-title').textContent = c.title;
    must<HTMLElement>('levels-title').textContent = c.levels;
    must<HTMLElement>('settings-label').textContent = c.tools;
    must<HTMLElement>('structure-detail-title').textContent = c.structure;
    must<HTMLElement>('fit-recent').textContent = c.recent;
    const commentary = must<HTMLElement>('research-reading');
    commentary.replaceChildren(element('h3', 'assessment-headline', trendTitle(r.trend, lang)),
      element('p', 'assessment-copy', researchCommentary(r, lang)));
    const evidence = must<HTMLElement>('research-evidence');
    const evidenceButton = document.createElement('button');
    evidenceButton.type = 'button';
    evidenceButton.className = 'evidence-link';
    evidenceButton.textContent = `${c.observations} ↗`;
    evidenceButton.title = c.evidenceTip;
    evidenceButton.disabled = shownBars.length === 0;
    evidenceButton.addEventListener('click', () => {
      showMa = true;
      paint(false);
      if (shownBars.length) chart.reveal(shownBars[Math.max(0, shownBars.length - 21)].time, shownBars[shownBars.length - 1].time);
      focusChart();
    });
    const metrics = element('dl', 'research-metrics');
    metrics.append(quoteField(c.ma, r.ma20 === undefined ? c.missing : formatPrice(r.ma20)),
      quoteField(c.deviation, r.deviation === undefined ? c.missing : formatPercent(r.deviation)),
      quoteField(c.momentum, r.dif === undefined || r.dea === undefined ? c.missing : `${formatPrice(r.dif)} / ${formatPrice(r.dea)}`),
      quoteField(c.volume, r.volumeRatio === undefined ? c.noVolume : `${r.volumeRatio.toFixed(2)}×`));
    const method = document.createElement('details');
    method.className = 'calculation-note';
    method.append(element('summary', undefined, lang === 'zh' ? '计算口径与局限' : 'Definitions & limits'), element('p', 'meta', c.definition));
    evidence.replaceChildren(evidenceButton, metrics, method);
    const levels = must<HTMLElement>('research-levels');
    levels.replaceChildren();
    for (const item of r.levels) {
      const button = document.createElement('button');
      button.type = 'button';
      const id = item.kind;
      button.className = 'reference-level';
      button.setAttribute('aria-pressed', selectedLevel === id ? 'true' : 'false');
      button.title = c.levelTip;
      const title = element('span', 'reference-name', c.levelName[item.kind]);
      if (item.provisional) title.append(element('small', undefined, c.provisional));
      button.append(title, element('strong', 'reference-price', formatPrice(item.price)),
        element('span', 'reference-distance', `${levelPosition(item, lang)} ↗`));
      button.addEventListener('click', () => {
        const deselect = selectedLevel === id;
        selectedLevel = deselect ? null : id;
        chart.setReferenceLevel(deselect ? undefined : item.price);
        if (!deselect) chart.reveal(item.from, Math.max(item.to, shownBars.at(-1)?.time ?? item.to));
        renderResearch(latest);
        const updated = levels.querySelector<HTMLButtonElement>(`[aria-pressed="${!deselect}"]`);
        updated?.focus({ preventScroll: true });
        selectStatus.textContent = `${c.levelName[item.kind]} ${formatPrice(item.price)} · ${levelPosition(item, lang)}`;
        focusChart();
      });
      levels.append(button);
    }
    if (!r.levels.length) levels.append(element('p', 'meta', c.missing));
    must<HTMLElement>('levels-note').textContent = c.levelNote;
    const scenarios = must<HTMLElement>('research-scenarios');
    const scenario = scenarioText(r, lang);
    scenarios.replaceChildren();
    if (scenario) scenarios.append(element('h3', undefined, lang === 'zh' ? '观察条件' : 'Conditional tests'),
      element('p', 'range-assessment', rangeAssessment(r, lang)), element('p', 'scenario', scenario.upper), element('p', 'scenario', scenario.lower));
    must<HTMLElement>('research-limits').textContent = c.limits;
  }

  function renderComparison(): void {
    const c = researchCopy(lang);
    const ui = text();
    must<HTMLElement>('comparison-title').textContent = c.comparison;
    must<HTMLElement>('comparison-note').textContent = c.pairNote;
    const containers = [must<HTMLElement>('comparison-rows'), must<HTMLElement>('mobile-comparison')];
    for (const container of containers) {
      container.replaceChildren();
      if (container.id === 'mobile-comparison') container.append(element('h2', undefined, c.comparison));
      if (comparisonRows.length === 0) {
        container.append(element('p', 'meta', live ? c.pending : lang === 'zh' ? '周期对照仅用于公开行情。' : 'Comparison is available for public quotes.'));
      }
      for (const row of comparisonRows) {
        const block = element('div', 'comparison-row');
        const label = timeframeWords(row.timeframe, ui);
        if (row.status !== 'ready') {
          block.append(element('strong', undefined, label), element('span', 'meta', row.status === 'loading' ? c.pending : c.unavailable));
        } else {
          const r = buildResearch(row.quote.bars);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'comparison-switch';
          button.textContent = `${label} ↗`;
          button.setAttribute('aria-label', `${label} · ${row.quote.display}`);
          button.addEventListener('click', () => {
            if (live) void loadLive(live.symbol, row.timeframe);
            setMobilePanel('chart');
          });
          block.append(button, element('strong', 'comparison-trend', trendTitle(r.trend, lang)),
            element('span', 'comparison-value', r.ma20 === undefined || r.deviation === undefined ? c.missing : `MA20 ${formatPrice(r.ma20)} · ${formatPercent(r.deviation)}`));
          const stamp = lastBarClock(row.quote.bars.at(-1), row.timeframe);
          block.append(element('span', 'comparison-source', `${sourceName(row.quote.source)} · ${ui.lastBar(stamp ?? '—')} · ${ui.notRealtime} · ${row.quote.delayed ? ui.delayedYes : ui.maybeDelayed}`));
        }
        container.append(block);
      }
      if (container.id === 'mobile-comparison') container.append(element('p', 'meta', c.pairNote));
    }
  }

  function readingInput(latest: Hub | undefined): ReadingInput {
    const input: ReadingInput = {};
    const lastBi = analysis.bi[analysis.bi.length - 1];
    const lastSeg = analysis.segments[analysis.segments.length - 1];
    const close = shownBars[shownBars.length - 1]?.close;
    if (lastBi) input.bi = { direction: lastBi.direction };
    if (lastSeg) input.seg = { direction: lastSeg.direction, finished: lastSeg.finished };
    if (latest && close !== undefined) {
      input.hub = {
        zd: formatPrice(latest.zd),
        zg: formatPrice(latest.zg),
        place: priceBand(close, latest.zd, latest.zg),
      };
    }
    return input;
  }

  function stateRow(term: string, value: string, sub?: string): HTMLElement {
    const row = element('div');
    row.append(element('dt', undefined, term));
    const detail = element('dd');
    detail.append(document.createTextNode(value));
    if (sub) detail.append(element('span', 'sub', sub));
    row.append(detail);
    return row;
  }

  function renderState(latest: Hub | undefined, reading: ReadingInput): void {
    const ui = text();
    const paragraph = element('p', 'reading', ui.reading(reading));
    const list = document.createElement('dl');
    list.className = 'state';
    const lastBi = analysis.bi[analysis.bi.length - 1];
    const lastSeg = analysis.segments[analysis.segments.length - 1];
    list.append(
      stateRow(
        ui.stateBi,
        lastBi ? `${lastBi.direction === 'up' ? ui.dirUp : ui.dirDown}，${ui.unconfirmed}` : ui.noneStruct,
        lastBi && analysis.bi.length > 1 ? ui.priorBi(analysis.bi.length - 1) : undefined,
      ),
    );
    list.append(
      stateRow(
        ui.stateSeg,
        lastSeg
          ? `${lastSeg.direction === 'up' ? ui.dirUp : ui.dirDown}，${lastSeg.finished ? ui.confirmed : ui.unconfirmed}`
          : ui.noneStruct,
      ),
    );
    if (!latest || !reading.hub) {
      const row = stateRow(ui.stateZs, ui.noneStruct, shownBars.length === 0 ? ui.emptyQuote : ui.noHubBody);
      row.classList.add('is-lead');
      list.append(row);
    } else {
      const placeText =
        reading.hub.place === 'above' ? ui.priceAbove : reading.hub.place === 'below' ? ui.priceBelow : ui.priceInside;
      const row = stateRow(
        ui.stateZs,
        `${ui.zg}\u00a0${reading.hub.zg}，${ui.zd}\u00a0${reading.hub.zd}`,
        `${placeText} · ${ui.status(latest.status, latest.extended, latest.level)} · ${formatDayRange(latest.startTime, latest.endTime)}`,
      );
      row.classList.add('is-lead');
      list.append(row);
    }
    list.append(
      stateRow(
        ui.stateCount,
        ui.counts(
          shownBars.length,
          analysis.bi.length,
          analysis.segments.length,
          activeHubs().length,
          activeMarks().length,
        ),
      ),
    );
    callout.replaceChildren(paragraph, list);
    callout.className = 'callout';
  }

  function renderList(hubs: Hub[], marks: Mark[]): void {
    const ui = text();
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.hubId : undefined;
    hubList.replaceChildren();
    if (hubs.length === 0) {
      const finished = analysis.segments.filter((segment) => segment.finished).length;
      const reason = emptyHubReason({
        level,
        barCount: shownBars.length,
        strokeCount: analysis.bi.length,
        segmentCount: analysis.segments.length,
        finishedSegments: finished,
        timeframe: shownTimeframe(),
      });
      const empty = element('div', 'empty-hub');
      empty.append(element('strong', undefined, ui.noHubTitle));
      const body =
        reason.kind === 'weekly-no-structure'
          ? ui.emptyWeekly(reason.bars, reason.strokes)
          : reason.kind === 'need-segments'
            ? ui.emptyNeedSeg(reason.segments, reason.finished)
            : ui.emptyNeedBi(reason.bars, reason.strokes);
      empty.append(element('p', 'meta', shownBars.length === 0 ? ui.emptyQuote : body));
      hubList.append(empty);
      return;
    }
    hubs.forEach((hub, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hub-card';
      button.dataset.hubId = hub.id;
      if (hub.id === hubs[hubs.length - 1]?.id) button.classList.add('is-latest');
      if (hub.id === selectedId) button.classList.add('is-selected');
      button.setAttribute('aria-pressed', hub.id === selectedId ? 'true' : 'false');
      const title = element('div', 'row');
      title.append(element('strong', undefined, ui.hubTitle(hub.level, index + 1)));
      const tags: string[] = [];
      if (hub.id === hubs[hubs.length - 1]?.id) tags.push(ui.latestTag);
      if (hub.id === selectedId) tags.push(ui.selected);
      if (tags.length) title.append(element('span', undefined, tags.join(' · ')));
      const prices = element('div', 'prices');
      prices.append(element('span', 'edge', `${ui.zg} ${formatPrice(hub.zg)}`));
      prices.append(element('span', 'edge', `${ui.zd} ${formatPrice(hub.zd)}`));
      prices.append(element('span', 'extreme', `${ui.gg} ${formatPrice(hub.gg)}`));
      prices.append(element('span', 'extreme', `${ui.dd} ${formatPrice(hub.dd)}`));
      button.append(title, prices);
      button.append(element('div', 'meta', formatDayRange(hub.startTime, hub.endTime)));
      const status = [
        ui.status(hub.status, hub.extended, hub.level),
        hub.enterDirection === 'up' ? ui.enterUp : ui.enterDown,
      ].join(lang === 'zh' ? '，' : '. ');
      button.append(element('div', 'status-line', status));
      button.append(element('div', 'meta', ui.members(hub.memberIds.length, hub.level)));
      const mark = marks.find((item) => item.hubId === hub.id);
      if (mark) {
        const markName = mark.kind === 'buy3' ? ui.buy : ui.sell;
        const pending = mark.pending ? ` · ${ui.unconfirmed}` : '';
        button.append(element('div', 'mark-line', `${markName}\u00a0${formatPrice(mark.price)} · ${formatDayNowrap(mark.time)}${pending}`));
      }
      button.addEventListener('click', () => {
        selectedId = selectedId === hub.id ? null : hub.id;
        if (selectedId && !layers.zs) layers = { ...layers, zs: true };
        paint(false);
        if (selectedId === hub.id) chart.reveal(hub.startTime, hub.endTime);
        announce();
      });
      hubList.append(button);
    });
    if (focused) hubList.querySelector<HTMLButtonElement>(`[data-hub-id="${CSS.escape(focused)}"]`)?.focus();
  }

  function announce(): void {
    const hub = activeHubs().find((item) => item.id === selectedId);
    selectStatus.textContent = hub ? text().selectedAnnounce(formatPrice(hub.zd), formatPrice(hub.zg)) : '';
  }

  function rememberQuote(quote: PublicQuote): void {
    watchCache.set(quote.display, {
      name: quote.name,
      last: quote.last,
      changePercent: quote.changePercent,
    });
  }

  async function loadLive(symbol: string, requestedTimeframe: Timeframe = timeframe): Promise<void> {
    const serial = ++requestSerial;
    if (stage) stage.setAttribute('aria-busy', 'true');
    notice = { kind: 'loading', symbol, timeframe: requestedTimeframe };
    comparisonRows = comparisonRows.map(row => row.status === 'loading' ? { timeframe: row.timeframe, status: 'unavailable' } : row);
    renderComparison();
    renderBanner();
    try {
      const mapped = mapSymbol(symbol);
      if (mapped.market === 'ashare' || mapped.market === 'us') market = mapped.market;
      const quote = await fetchPublicQuote(symbol, requestedTimeframe);
      if (serial !== requestSerial) return;
      if (!matchesQuote(quote, symbol, requestedTimeframe)) throw new Error(lang === 'zh' ? '行情周期或数据校验未通过。' : 'Quote interval or data validation failed.');
      timeframe = quote.timeframe;
      live = { symbol: quote.display, source: quote.source, name: quote.name };
      lastQuote = quote;
      failedSymbol = null;
      notice = { kind: 'none' };
      rememberQuote(quote);
      customSymbol.value = quote.display;
      persistDisplaySymbol(quote.display);
      comparisonRows = (['D', 'W'] as const).map(tf => ({ timeframe: tf, status: 'loading' }));
      useBars(quote.bars, true);
      void loadComparison(quote, fetchPublicQuote, (row) => {
        comparisonRows = comparisonRows.map(previous => previous.timeframe === row.timeframe ? row : previous);
        renderComparison();
      }, () => serial === requestSerial);
    } catch (error) {
      if (serial !== requestSerial) return;
      const reasons = error instanceof QuoteError ? error.reasons : [error instanceof Error ? error.message : 'failed'];
      const badSymbol = reasons.length === 1 && reasons[0] === 'symbol';
      failedSymbol = badSymbol ? null : symbol;
      notice = {
        kind: 'fail',
        headline: badSymbol ? 'bad' : 'quote',
        reasons: reasons.filter((reason) => reason !== 'symbol'),
      };
      if (shownBars.length === 0) {
        live = null;
        lastQuote = null;
      }
      paint(false);
    }
  }

  function focusChart(): void {
    setMobilePanel('chart');
    if (window.matchMedia('(max-width: 900px)').matches) chartHost.focus({ preventScroll: true });
  }

  function setMobilePanel(next: 'chart' | 'watch' | 'dock'): void {
    mobilePanel = next;
    desk.classList.toggle('is-drawer-watch', next === 'watch');
    desk.classList.toggle('is-drawer-dock', next === 'dock');
    tabChart.setAttribute('aria-pressed', next === 'chart' ? 'true' : 'false');
    tabWatch.setAttribute('aria-pressed', next === 'watch' ? 'true' : 'false');
    tabDock.setAttribute('aria-pressed', next === 'dock' ? 'true' : 'false');
  }

  for (const button of tfButtons) {
    button.addEventListener('click', () => {
      const next = button.dataset.tf;
      if (next !== '5m' && next !== '15m' && next !== '30m' && next !== '1h' && next !== 'D' && next !== 'W') return;
      if (button.disabled || !canSelectTimeframe(next, live !== null)) return;
      if (live) {
        void loadLive(live.symbol, next);
        return;
      }
      timeframe = next;
      useBars(rawBars, true);
    });
  }

  function setLayers(next: typeof layers): void {
    layers = next;
    paint(false);
  }
  fitAll.addEventListener('click', () => {
    chart.fitAll();
    must<HTMLDetailsElement>('chart-settings').open = false;
  });
  must<HTMLElement>('fit-recent').addEventListener('click', () => {
    chart.fitRecent(shownBars.length);
    must<HTMLDetailsElement>('chart-settings').open = false;
  });
  layerAll.addEventListener('click', () => setLayers({ bi: true, seg: true, zs: true, bsp: true }));
  layerNone.addEventListener('click', () => setLayers({ bi: false, seg: false, zs: false, bsp: false }));
  layerBi.addEventListener('click', () => setLayers({ ...layers, bi: !layers.bi }));
  layerSeg.addEventListener('click', () => setLayers({ ...layers, seg: !layers.seg }));
  layerZs.addEventListener('click', () => setLayers({ ...layers, zs: !layers.zs }));
  layerBsp.addEventListener('click', () => setLayers({ ...layers, bsp: !layers.bsp }));
  layerMa.addEventListener('click', () => {
    showMa = !showMa;
    paint(false);
  });

  marketA.addEventListener('click', () => {
    market = 'ashare';
    paint(false);
  });
  marketUs.addEventListener('click', () => {
    market = 'us';
    paint(false);
  });

  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const symbol = customSymbol.value.trim();
    if (!symbol) {
      notice = { kind: 'fail', headline: 'empty', reasons: [] };
      renderBanner();
      customSymbol.focus();
      return;
    }
    void loadLive(symbol);
  });

  levelBi.addEventListener('click', () => {
    level = 'bi';
    chart.setReferenceLevel();
    selectedLevel = null;
    selectedId = null;
    paint(false);
  });
  levelSeg.addEventListener('click', () => {
    level = 'segment';
    chart.setReferenceLevel();
    selectedLevel = null;
    selectedId = null;
    paint(false);
  });

  langButton.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    applyStaticCopy();
    paint(true);
  });

  const settings = must<HTMLDetailsElement>('chart-settings');
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !settings.contains(event.target)) settings.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settings.open) {
      settings.open = false;
      must<HTMLElement>('settings-label').focus();
    }
  });
  methodsButton.addEventListener('click', () => {
    settings.open = false;
    renderMethods();
    dialog.showModal();
    methodsTitle.focus();
  });
  methodsClose.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => must<HTMLElement>('settings-label').focus());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelector<HTMLAnchorElement>('.skip')?.addEventListener('click', (event) => {
    event.preventDefault();
    setMobilePanel('dock');
    const heading = must<HTMLElement>('research-title');
    heading.tabIndex = -1;
    heading.focus();
  });
  tabChart.addEventListener('click', () => setMobilePanel('chart'));
  tabWatch.addEventListener('click', () => setMobilePanel(mobilePanel === 'watch' ? 'chart' : 'watch'));
  tabDock.addEventListener('click', () => setMobilePanel(mobilePanel === 'dock' ? 'chart' : 'dock'));

  const initialSymbol = bootSymbol();
  customSymbol.value = initialSymbol;
  applyStaticCopy();
  paint(false);
  void loadLive(initialSymbol);
}

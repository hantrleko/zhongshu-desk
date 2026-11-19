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
import { formatChange, formatDay, formatPercent, formatPrice, formatVolume } from '../format.ts';
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
  let showMa = false;
  let selectedId: string | null = null;
  let rawBars: Bar[] = [];
  let shownBars: Bar[] = [];
  let analysis: Analysis = analyze(rawBars);
  let requestSerial = 0;
  let fitNext = true;
  let failedSymbol: string | null = null;
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

  function timeframeLabel(): string {
    return timeframe;
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
  }

  type Notice =
    | { kind: 'none' }
    | { kind: 'loading'; symbol: string }
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
    if (notice.kind === 'loading') lines.push(ui.loading(notice.symbol, timeframeLabel()));
    if (notice.kind === 'fail') {
      if (notice.headline === 'quote') lines.push(ui.quoteFail);
      if (notice.headline === 'bad') lines.push(ui.badSymbol);
      if (notice.headline === 'empty') lines.push(ui.emptySymbol);
      lines.push(...notice.reasons);
    }
    banner.replaceChildren(...lines.filter(Boolean).map((line) => element('p', undefined, line)));
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
    shownBars = applyTimeframe(rawBars, shownTimeframe());
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
    if (live) {
      const named = lastQuote?.name ? ` · ${lastQuote.name}` : '';
      sourceLine.textContent = `${ui.provenanceQuote} · ${sourceName(live.source)} · ${live.symbol}${named}`;
    } else if (failedSymbol && shownBars.length === 0) {
      sourceLine.textContent = ui.fallbackLesson(failedSymbol);
    } else if (shownBars.length === 0) {
      sourceLine.textContent = ui.emptyQuote;
    } else {
      sourceLine.textContent = `${ui.provenanceLesson} · ${ui.teachingPrices}`;
    }
    const parts = [ui.timeframeLine(requested, requested)];
    if (!live && shownBars.length > 0) parts.push(ui.lessonTfHint);
    if (!live && shown === 'W' && shownBars.length > 0) parts.push(ui.weeklyNote);
    timeframeLine.textContent = parts.join(' ');
    const stamp = lastBarClock(shownBars[shownBars.length - 1], shown);
    if (stamp) {
      const tags = [ui.lastBar(stamp), ui.notRealtime];
      if (live) tags.push(lastQuote?.delayed ? ui.delayedYes : ui.maybeDelayed);
      else tags.push(ui.teachingPrices);
      freshnessLine.textContent = tags.join(' · ');
    } else {
      freshnessLine.textContent = shownBars.length === 0 ? '' : ui.notRealtime;
    }
  }

  function renderLegend(): void {
    const ui = text();
    legend.setAttribute('aria-label', ui.legend);
    legend.replaceChildren();
    const items: Array<{ swatch: string; color?: string; text: string; mark?: string }> = [
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
    if (computeMacd(shownBars).length > 0) items.push({ swatch: 'swatch', color: '#d6c07a', text: ui.legendMacd });
    for (const item of items) {
      const row = document.createElement('li');
      const sample = document.createElement('span');
      sample.className = item.swatch;
      sample.setAttribute('aria-hidden', 'true');
      if (item.color) sample.style.color = item.color;
      if (item.mark) sample.textContent = item.mark;
      row.append(sample, document.createTextNode(item.text));
      legend.append(row);
    }
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
    if (stamp) grid.append(quoteField(ui.fieldTime, stamp));
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
    stageReading.textContent = ui.stageReading(reading);
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
    renderList(hubs, marks);
    if (stage) stage.setAttribute('aria-busy', 'false');
    if (announceSelection) announce();
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
        `${ui.zg} ${reading.hub.zg}，${ui.zd} ${reading.hub.zd}`,
        `${placeText} · ${ui.status(latest.status, latest.extended, latest.level)} · ${formatDay(latest.startTime)} → ${formatDay(latest.endTime)}`,
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
      button.append(element('div', 'meta', `${formatDay(hub.startTime)} → ${formatDay(hub.endTime)}`));
      const status = [
        ui.status(hub.status, hub.extended, hub.level),
        hub.enterDirection === 'up' ? ui.enterUp : ui.enterDown,
      ].join(lang === 'zh' ? '，' : '. ');
      button.append(element('div', 'status-line', status));
      button.append(element('div', 'meta', ui.members(hub.memberIds.length, hub.level)));
      const mark = marks.find((item) => item.hubId === hub.id);
      if (mark) {
        const markName = mark.kind === 'buy3' ? ui.buy : ui.sell;
        button.append(element('div', 'mark-line', `${markName} ${formatPrice(mark.price)} · ${formatDay(mark.time)}`));
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

  async function loadLive(symbol: string): Promise<void> {
    const serial = ++requestSerial;
    if (stage) stage.setAttribute('aria-busy', 'true');
    notice = { kind: 'loading', symbol };
    renderBanner();
    try {
      const mapped = mapSymbol(symbol);
      if (mapped.market === 'ashare' || mapped.market === 'us') market = mapped.market;
      const quote = await fetchPublicQuote(symbol, timeframe);
      if (serial !== requestSerial) return;
      live = { symbol: quote.display, source: quote.source, name: quote.name };
      lastQuote = quote;
      failedSymbol = null;
      notice = { kind: 'none' };
      rememberQuote(quote);
      customSymbol.value = quote.display;
      persistDisplaySymbol(quote.display);
      useBars(quote.bars, true);
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
      timeframe = next;
      if (live) {
        void loadLive(live.symbol);
        return;
      }
      useBars(rawBars, true);
    });
  }

  function setLayers(next: typeof layers): void {
    layers = next;
    paint(false);
  }
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
    selectedId = null;
    paint(false);
  });
  levelSeg.addEventListener('click', () => {
    level = 'segment';
    selectedId = null;
    paint(false);
  });

  langButton.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    applyStaticCopy();
    paint(true);
  });

  methodsButton.addEventListener('click', () => {
    renderMethods();
    dialog.showModal();
    methodsTitle.focus();
  });
  methodsClose.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => methodsButton.focus());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
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

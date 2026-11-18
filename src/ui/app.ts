import { DeskChart } from '../chart/desk-chart.ts';
import type { ChartLabels } from '../chart/hub-primitive.ts';
import { applyTimeframe, type Timeframe } from '../data/resample.ts';
import {
  applyLayerVisibility,
  canSelectTimeframe,
  emptyHubReason,
  lastBarClock,
  resolveShownTimeframe,
} from './clarity.ts';
import { fixtureById, fixtures, type Fixture } from '../data/fixtures.ts';
import { fetchPublicQuote, QuoteError } from '../data/quote.ts';
import { analyze } from '../engine/analyze.ts';
import { priceBand } from '../engine/readout.ts';
import type { Analysis, Bar, Hub, HubLevel, Mark } from '../engine/types.ts';
import { formatDay, formatPrice } from '../format.ts';
import { copy, type Lang } from '../i18n.ts';

interface LiveSource {
  symbol: string;
  source: 'yahoo' | 'stooq';
}

const LIVE_PRESETS = ['AAPL', 'MSFT', '0700.HK'];

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

export function startDesk(): void {
  const symbolSelect = must<HTMLSelectElement>('symbol');
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
  const tfButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tf]'));
  const callout = must<HTMLElement>('callout');
  const hubList = must<HTMLElement>('hub-list');
  const selectStatus = must<HTMLElement>('select-status');
  const footerChart = must<HTMLElement>('footer-chart');
  const footerAdvice = must<HTMLElement>('footer-advice');
  const quoteHint = must<HTMLElement>('quote-hint');
  const stage = must<HTMLElement>('chart').closest('section');

  let lang: Lang = 'zh';
  let fixtureId = fixtures[0].id;
  let live: LiveSource | null = null;
  let timeframe: Timeframe = 'D';
  let level: HubLevel = 'bi';
  let layers = { bi: true, seg: true, zs: true, bsp: true };
  let selectedId: string | null = null;
  let rawBars: Bar[] = fixtures[0].bars;
  let shownBars: Bar[] = fixtures[0].bars;
  let analysis: Analysis = analyze(rawBars);
  let requestSerial = 0;
  let fitNext = true;
  let failedSymbol: string | null = null;

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
    shownTimeframe();
    useBars(nextRaw, fit);
  }

  function labels(): ChartLabels {
    const ui = text();
    return { latest: ui.latestTag, selected: ui.selectedTag, zg: ui.zg, zd: ui.zd, buy: ui.buy, sell: ui.sell };
  }

  function fillSymbolOptions(): void {
    const previous = symbolSelect.value;
    symbolSelect.replaceChildren();
    const lessons = document.createElement('optgroup');
    lessons.label = lang === 'zh' ? '样例' : 'Lessons';
    for (const fixture of fixtures) {
      const option = document.createElement('option');
      option.value = `fixture:${fixture.id}`;
      option.textContent = fixture.title[lang];
      lessons.append(option);
    }
    const quotes = document.createElement('optgroup');
    quotes.label = lang === 'zh' ? '公开行情' : 'Public quote';
    const liveSymbols = live && !LIVE_PRESETS.includes(live.symbol) ? [...LIVE_PRESETS, live.symbol] : LIVE_PRESETS;
    for (const symbol of liveSymbols) {
      const option = document.createElement('option');
      option.value = `live:${symbol}`;
      option.textContent = symbol;
      quotes.append(option);
    }
    symbolSelect.append(lessons, quotes);
    const desired = live ? `live:${live.symbol}` : `fixture:${fixtureId}`;
    const hasDesired = Array.from(symbolSelect.options).some((option) => option.value === desired);
    symbolSelect.value = hasDesired ? desired : previous;
    if (symbolSelect.value === '') symbolSelect.value = `fixture:${fixtureId}`;
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
    quoteHint.textContent = ui.quoteHint;
    customSymbol.placeholder = ui.placeholder;
    const skip = document.querySelector('.skip');
    if (skip) skip.textContent = ui.skip;
    footerAdvice.textContent = ui.advice;
    const link = document.createElement('a');
    link.href = 'https://www.tradingview.com/';
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.textContent = ui.footerName;
    footerChart.replaceChildren(document.createTextNode(ui.footerBefore), link, document.createTextNode(ui.footerAfter));
    fillSymbolOptions();
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
      const sourceName = live.source === 'yahoo' ? 'Yahoo' : 'Stooq';
      sourceLine.textContent = `${ui.provenanceQuote} · ${sourceName} · ${live.symbol}`;
    } else if (failedSymbol) {
      sourceLine.textContent = ui.fallbackLesson(failedSymbol);
    } else {
      sourceLine.textContent = `${ui.provenanceLesson} · ${ui.teachingPrices}`;
    }
    const parts = [ui.timeframeLine(requested, requested)];
    if (!live) parts.push(ui.lessonTfHint);
    if (!live && shown === 'W') parts.push(ui.weeklyNote);
    timeframeLine.textContent = parts.join(' ');
    const stamp = lastBarClock(shownBars[shownBars.length - 1], shown);
    if (stamp) {
      const tags = [ui.lastBar(stamp), ui.notRealtime];
      if (live) tags.push(ui.maybeDelayed);
      else tags.push(ui.teachingPrices);
      freshnessLine.textContent = tags.join(' · ');
    } else {
      freshnessLine.textContent = ui.notRealtime;
    }
  }

  function renderLegend(): void {
    const ui = text();
    legend.setAttribute('aria-label', ui.legend);
    legend.replaceChildren();
    const items: Array<{ swatch: string; color?: string; text: string; mark?: string }> = [
      { swatch: 'swatch', color: '#f4f4f4', text: ui.legendBi },
      { swatch: 'swatch is-dashed', color: '#f4f4f4', text: ui.legendBiOpen },
      { swatch: 'swatch', color: '#5b8def', text: ui.legendSeg },
      { swatch: 'swatch is-dashed', color: '#5b8def', text: ui.legendSegOpen },
      { swatch: 'swatch is-hub', text: ui.legendZs },
      { swatch: 'swatch is-mark', text: ui.buy, mark: ui.buy },
      { swatch: 'swatch is-mark', text: ui.sell, mark: ui.sell },
    ];
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

  function paint(announceSelection: boolean): void {
    renderBanner();
    const ui = text();
    const fixture = currentFixture();
    const hubs = activeHubs();
    const marks = activeMarks();
    const latest = hubs[hubs.length - 1];
    studyTitle.textContent = live ? live.symbol : fixture.title[lang];
    studyBlurb.textContent = live
      ? lang === 'zh'
        ? '这是公开行情，不是样例。中枢按同一套规则现算。'
        : 'This is a public quote, not a lesson. Hubs are computed with the same rules.'
      : fixture.blurb[lang];
    renderProvenance();
    renderLegend();
    levelNote.textContent =
      level === 'bi' ? ui.levelNoteBi : analysis.segmentHubs.length === 0 ? ui.levelNoteSegEmpty : ui.levelNoteSeg;
    const finished = analysis.segments.filter((segment) => segment.finished).length;
    const unfinished = analysis.segments.length - finished;
    const segmentText =
      lang === 'zh'
        ? `线段 ${finished} 完成 / ${unfinished} 未完成`
        : `segments ${finished} finished / ${unfinished} unfinished`;
    const countLine =
      lang === 'zh'
        ? `K ${shownBars.length} · 笔 ${analysis.bi.length} · 段 ${analysis.segments.length} · 中枢 ${hubs.length} · BSP ${marks.length}`
        : `K ${shownBars.length} · BI ${analysis.bi.length} · Seg ${analysis.segments.length} · ZS ${hubs.length} · BSP ${marks.length}`;
    structureCount.textContent = `${countLine} · ${segmentText}`;
    levelBi.textContent = lang === 'zh' ? `笔级 ${analysis.biHubs.length}` : `Stroke ${analysis.biHubs.length}`;
    levelSeg.textContent = lang === 'zh' ? `段级 ${analysis.segmentHubs.length}` : `Segment ${analysis.segmentHubs.length}`;
    layerAll.textContent = ui.showAll;
    layerNone.textContent = ui.hideAll;
    const shown = shownTimeframe();
    for (const button of tfButtons) {
      const tf = button.dataset.tf;
      const allowed = tf === '5m' || tf === '15m' || tf === '30m' || tf === '1h' || tf === 'D' || tf === 'W'
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
    levelBi.setAttribute('aria-pressed', level === 'bi' ? 'true' : 'false');
    levelSeg.setAttribute('aria-pressed', level === 'segment' ? 'true' : 'false');
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
    });
    fitNext = false;
    chart.setOverlay({
      hubs: visible.hubs,
      marks: visible.marks,
      selectedId,
      labels: labels(),
      fontFamily: getComputedStyle(document.body).fontFamily || 'sans-serif',
    });
    renderState(latest);
    renderList(hubs, marks);
    if (stage) stage.setAttribute('aria-busy', 'false');
    if (announceSelection) announce();
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

  function renderState(latest: Hub | undefined): void {
    const ui = text();
    const list = document.createElement('dl');
    list.className = 'state';
    const lastBi = analysis.bi[analysis.bi.length - 1];
    const lastSeg = analysis.segments[analysis.segments.length - 1];
    const close = shownBars[shownBars.length - 1]?.close;
    list.append(
      stateRow(
        ui.stateBi,
        lastBi ? `${lastBi.direction === 'up' ? ui.dirUp : ui.dirDown} · ${ui.unconfirmed}` : ui.noneStruct,
        lastBi && analysis.bi.length > 1 ? ui.priorBi(analysis.bi.length - 1) : undefined,
      ),
    );
    list.append(
      stateRow(
        ui.stateSeg,
        lastSeg
          ? `${lastSeg.direction === 'up' ? ui.dirUp : ui.dirDown} · ${lastSeg.finished ? ui.confirmed : ui.unconfirmed}`
          : ui.noneStruct,
      ),
    );
    if (!latest || close === undefined) {
      const row = stateRow(ui.stateZs, ui.noneStruct, ui.noHubBody);
      row.classList.add('is-lead');
      list.append(row);
    } else {
      const place = priceBand(close, latest.zd, latest.zg);
      const placeText = place === 'above' ? ui.priceAbove : place === 'below' ? ui.priceBelow : ui.priceInside;
      const row = stateRow(
        ui.stateZs,
        `ZG ${formatPrice(latest.zg)} — ZD ${formatPrice(latest.zd)} · ${placeText}`,
        `${ui.status(latest.status, latest.extended, latest.level)} · ${formatDay(latest.startTime)} → ${formatDay(latest.endTime)}`,
      );
      row.classList.add('is-lead');
      list.append(row);
    }
    const bsp = activeMarks().length;
    const counts =
      lang === 'zh'
        ? `K ${shownBars.length} · 笔 ${analysis.bi.length} · 段 ${analysis.segments.length} · 中枢 ${activeHubs().length} · BSP ${bsp}`
        : `K ${shownBars.length} · BI ${analysis.bi.length} · Seg ${analysis.segments.length} · ZS ${activeHubs().length} · BSP ${bsp}`;
    list.append(stateRow(ui.stateCount, counts));
    callout.replaceChildren(list);
    callout.className = '';
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
      empty.append(element('p', 'meta', body));
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
      const name = lang === 'zh' ? `${hub.level === 'bi' ? '笔' : '段'}中枢 ${index + 1}` : `${hub.level === 'bi' ? 'Stroke' : 'Segment'} hub ${index + 1}`;
      title.append(element('strong', undefined, name));
      const tags: string[] = [];
      if (hub.id === hubs[hubs.length - 1]?.id) tags.push(ui.latestTag);
      if (hub.id === selectedId) tags.push(ui.selected);
      if (tags.length) title.append(element('span', undefined, tags.join(' · ')));
      const prices = element('div', 'prices');
      prices.append(element('span', 'zg', `${ui.zd} ${formatPrice(hub.zd)}`));
      prices.append(element('span', 'zg', `${ui.zg} ${formatPrice(hub.zg)}`));
      prices.append(element('span', undefined, `${ui.dd} ${formatPrice(hub.dd)}`));
      prices.append(element('span', undefined, `${ui.gg} ${formatPrice(hub.gg)}`));
      button.append(title, prices);
      button.append(element('div', 'meta', `${formatDay(hub.startTime)} → ${formatDay(hub.endTime)}`));
      const detail = [
        ui.status(hub.status, hub.extended, hub.level),
        hub.extended ? ui.extended : '',
        ui.members(hub.memberIds.length, hub.level),
        hub.enterDirection === 'up' ? ui.enterUp : ui.enterDown,
      ].filter(Boolean).join(' · ');
      button.append(element('div', 'meta', detail));
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

  async function loadLive(symbol: string): Promise<void> {
    const serial = ++requestSerial;
    if (stage) stage.setAttribute('aria-busy', 'true');
    notice = { kind: 'loading', symbol };
    renderBanner();
    try {
      const quote = await fetchPublicQuote(symbol, timeframe);
      if (serial !== requestSerial) return;
      live = { symbol: quote.symbol, source: quote.source };
      failedSymbol = null;
      notice = { kind: 'none' };
      fillSymbolOptions();
      useBars(quote.bars, true);
    } catch (error) {
      if (serial !== requestSerial) return;
      live = null;
      failedSymbol = symbol;
      const reasons = error instanceof QuoteError ? error.reasons : [error instanceof Error ? error.message : 'failed'];
      const badSymbol = reasons.length === 1 && reasons[0] === 'symbol';
      notice = {
        kind: 'fail',
        headline: badSymbol ? 'bad' : 'quote',
        reasons: reasons.filter((reason) => reason !== 'symbol'),
      };
      fillSymbolOptions();
      adoptLesson(currentFixture().bars, true);
    }
  }

  symbolSelect.addEventListener('change', () => {
    const value = symbolSelect.value;
    if (value.startsWith('fixture:')) {
      requestSerial += 1;
      live = null;
      failedSymbol = null;
      fixtureId = value.slice('fixture:'.length);
      notice = { kind: 'none' };
      adoptLesson(currentFixture().bars, true);
      return;
    }
    if (value.startsWith('live:')) {
      const symbol = value.slice('live:'.length);
      customSymbol.value = symbol;
      void loadLive(symbol);
    }
  });

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

  applyStaticCopy();
  useBars(rawBars, true);
}

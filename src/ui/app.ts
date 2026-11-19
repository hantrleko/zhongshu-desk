import { DeskChart } from '../chart/desk-chart.ts';
import type { ChartLabels } from '../chart/hub-primitive.ts';
import { applyTimeframe, type Timeframe } from '../data/resample.ts';
import { fixtureById, fixtures, type Fixture } from '../data/fixtures.ts';
import { fetchPublicQuote, QuoteError } from '../data/quote.ts';
import {
  acceptQuote,
  chooseLesson,
  initialSession,
  noteEmptySymbol,
  rejectQuote,
  requestQuote,
  type Session,
} from '../desk/session.ts';
import { presentProvenance, presentStructureGap, segmentConfirmation, strokeConfirmation, type StructureGapModel } from '../desk/present.ts';
import { analyze } from '../engine/analyze.ts';
import { priceBand } from '../engine/readout.ts';
import type { Analysis, Bar, Hub, HubLevel, Mark } from '../engine/types.ts';
import { formatDay, formatPrice } from '../format.ts';
import { copy, type GlossaryEntry, type Lang } from '../i18n.ts';

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
  const studyHeading = must<HTMLElement>('study-heading');
  const studyTitle = must<HTMLElement>('study-title');
  const studyKind = must<HTMLElement>('study-kind');
  const studyBlurb = must<HTMLElement>('study-blurb');
  const provenance = must<HTMLElement>('provenance');
  const structureGap = must<HTMLElement>('structure-gap');
  const glossary = must<HTMLDetailsElement>('glossary');
  const glossarySummary = must<HTMLElement>('glossary-summary');
  const glossaryBody = must<HTMLElement>('glossary-body');
  const levelNote = must<HTMLElement>('level-note');
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
  let session: Session = initialSession(fixtures[0].id);
  let timeframe: Timeframe = 'D';
  let level: HubLevel = 'bi';
  let layers = { bi: true, seg: true, zs: true, bsp: true };
  let selectedId: string | null = null;
  let rawBars: Bar[] = fixtures[0].bars;
  let shownBars: Bar[] = fixtures[0].bars;
  let analysis: Analysis = analyze(rawBars);
  let requestSerial = 0;
  let fitNext = true;

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
    return fixtureById(session.fixtureId) ?? fixtures[0];
  }

  function gloss(id: GlossaryEntry['id']): GlossaryEntry | undefined {
    return text().glossaryEntries.find((entry) => entry.id === id);
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
    const shownSymbol = session.quote?.symbol;
    const liveSymbols = shownSymbol && !LIVE_PRESETS.includes(shownSymbol) ? [...LIVE_PRESETS, shownSymbol] : LIVE_PRESETS;
    for (const symbol of liveSymbols) {
      const option = document.createElement('option');
      option.value = `live:${symbol}`;
      option.textContent = symbol;
      quotes.append(option);
    }
    symbolSelect.append(lessons, quotes);
    const desired = session.quote ? `live:${session.quote.symbol}` : `fixture:${session.fixtureId}`;
    const hasDesired = Array.from(symbolSelect.options).some((option) => option.value === desired);
    symbolSelect.value = hasDesired ? desired : previous;
    if (symbolSelect.value === '') symbolSelect.value = `fixture:${session.fixtureId}`;
  }

  function glossaryBlock(idPrefix: string | null): HTMLElement {
    const ui = text();
    const host = document.createElement('div');
    const list = document.createElement('dl');
    for (const entry of ui.glossaryEntries) {
      const wrap = document.createElement('div');
      if (idPrefix) {
        wrap.id = `${idPrefix}-${entry.id}`;
        wrap.tabIndex = -1;
      }
      const term = document.createElement('dfn');
      term.textContent = entry.term;
      const dt = document.createElement('dt');
      dt.append(term);
      wrap.append(dt, element('dd', undefined, entry.text));
      list.append(wrap);
    }
    host.append(list, element('p', undefined, ui.glossaryConfirm), element('p', undefined, ui.glossarySchool));
    return host;
  }

  function renderGlossary(): void {
    glossarySummary.textContent = text().glossarySummary;
    glossaryBody.replaceChildren(glossaryBlock('gloss'));
  }

  function openGlossary(id: GlossaryEntry['id']): void {
    glossary.open = true;
    document.getElementById(`gloss-${id}`)?.focus();
  }

  function termButton(id: GlossaryEntry['id'], label: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'term';
    button.dataset.gloss = id;
    button.textContent = label;
    const entry = gloss(id);
    if (entry) button.title = entry.text;
    button.setAttribute('aria-describedby', `gloss-${id}`);
    button.addEventListener('click', () => openGlossary(id));
    return button;
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
    renderGlossary();
    if (dialog.open) renderMethods();
  }

  function renderMethods(): void {
    const ui = text();
    methodsTitle.textContent = ui.methodsTitle;
    methodsBody.replaceChildren();
    methodsBody.append(element('h3', undefined, ui.glossarySummary), glossaryBlock(null));
    for (const section of ui.methodSections) {
      methodsBody.append(element('h3', undefined, section.heading));
      for (const paragraph of section.paragraphs) methodsBody.append(element('p', undefined, paragraph));
    }
  }

  function renderBanner(lines: string[], isError: boolean): void {
    if (lines.length === 0) {
      banner.hidden = true;
      banner.replaceChildren();
      banner.classList.remove('is-error');
      return;
    }
    banner.hidden = false;
    banner.classList.toggle('is-error', isError);
    banner.replaceChildren(...lines.map((line) => element('p', undefined, line)));
  }

  function renderProvenance(): ReturnType<typeof presentProvenance> {
    const model = presentProvenance({
      lang,
      session,
      timeframe,
      fixture: currentFixture(),
      bars: shownBars,
      hubCount: activeHubs().length,
    });
    provenance.classList.toggle('is-fallback', model.fallback);
    provenance.classList.toggle('is-pending', model.pending);
    provenance.dataset.shownKind = model.shownKind;
    provenance.dataset.shownId = model.shownId;
    provenance.dataset.fallback = model.fallback ? 'true' : 'false';
    provenance.dataset.requested = model.requestedSymbol ?? '';
    const lines: HTMLElement[] = [];
    if (model.alert) lines.push(element('p', 'alert', model.alert));
    lines.push(element('p', undefined, model.source), element('p', undefined, model.range), element('p', undefined, model.fetchStatus));
    if (model.teachingNote) lines.push(element('p', 'teaching', model.teachingNote));
    provenance.replaceChildren(...lines);
    return model;
  }

  function renderGap(gap: StructureGapModel): void {
    structureGap.hidden = !gap.show;
    structureGap.replaceChildren();
    if (!gap.show) return;
    structureGap.append(element('h3', undefined, gap.title), element('p', undefined, gap.body));
  }

  function useBars(nextRaw: Bar[], fit: boolean): void {
    rawBars = nextRaw;
    shownBars = applyTimeframe(rawBars, timeframe);
    try {
      analysis = analyze(shownBars);
    } catch (error) {
      renderBanner([error instanceof Error ? error.message : 'failed'], true);
      return;
    }
    if (selectedId && !activeHubs().some((hub) => hub.id === selectedId)) selectedId = null;
    fitNext = fit;
    paint(false);
  }

  function paint(announceSelection: boolean): void {
    const ui = text();
    const hubs = activeHubs();
    const marks = activeMarks();
    fillSymbolOptions();
    const model = renderProvenance();
    renderBanner(model.banner, model.fallback);
    const gap = presentStructureGap({ lang, level, barCount: shownBars.length, analysis });
    renderGap(gap);
    const latest = hubs[hubs.length - 1];
    studyHeading.classList.toggle('is-fallback', model.fallback);
    studyTitle.textContent = model.title;
    studyKind.textContent = model.kindLabel;
    studyBlurb.textContent = model.blurb;
    levelNote.hidden = gap.show;
    levelNote.textContent = gap.show ? '' : level === 'bi' ? ui.levelNoteBi : ui.levelNoteSeg;
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
    for (const button of tfButtons) {
      button.setAttribute('aria-pressed', button.dataset.tf === timeframe ? 'true' : 'false');
    }
    for (const [button, id, on] of [
      [layerBi, 'bi', layers.bi],
      [layerSeg, 'seg', layers.seg],
      [layerZs, 'zs', layers.zs],
      [layerBsp, 'bsp', layers.bsp],
    ] as const) {
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.setAttribute('aria-describedby', `gloss-${id}`);
      const entry = gloss(id);
      if (entry) {
        button.textContent = entry.term;
        button.title = entry.text;
      }
    }
    levelBi.setAttribute('aria-pressed', level === 'bi' ? 'true' : 'false');
    levelSeg.setAttribute('aria-pressed', level === 'segment' ? 'true' : 'false');
    chartHost.setAttribute('aria-label', model.chartLabel);
    stage?.setAttribute('aria-label', lang === 'zh' ? '走势图' : 'Chart');
    stage?.setAttribute('aria-busy', model.pending ? 'true' : 'false');
    chart.setLocale(lang === 'zh' ? 'zh-Hans' : 'en-US');
    chart.setSeries({
      bars: shownBars,
      bi: layers.bi ? analysis.bi : [],
      segments: layers.seg ? analysis.segments : [],
      fit: fitNext,
    });
    fitNext = false;
    chart.setOverlay({
      hubs: layers.zs ? hubs : [],
      marks: layers.bsp ? marks : [],
      selectedId,
      labels: labels(),
      fontFamily: getComputedStyle(document.body).fontFamily || 'sans-serif',
    });
    renderState(latest, model.teachingNote, gap.show);
    renderList(hubs, marks, gap);
    if (announceSelection) announce();
  }

  function stateRow(term: HTMLElement | string, value: HTMLElement | string, subs: string[] = []): HTMLElement {
    const row = element('div');
    if (typeof term === 'string') row.append(element('dt', undefined, term));
    else {
      const dt = element('dt');
      dt.append(term);
      row.append(dt);
    }
    const detail = element('dd');
    if (typeof value === 'string') detail.append(document.createTextNode(value));
    else detail.append(value);
    for (const sub of subs) detail.append(element('span', 'sub', sub));
    row.append(detail);
    return row;
  }

  function renderState(latest: Hub | undefined, teachingNote: string | null, gapShown: boolean): void {
    const ui = text();
    const list = document.createElement('dl');
    list.className = 'state';
    const lastBi = analysis.bi[analysis.bi.length - 1];
    const lastSeg = analysis.segments[analysis.segments.length - 1];
    const close = shownBars[shownBars.length - 1]?.close;
    const biState = strokeConfirmation(analysis.bi.length - 1, analysis.bi.length);
    list.append(
      stateRow(
        termButton('bi', ui.stateBi),
        lastBi ? `${lastBi.direction === 'up' ? ui.dirUp : ui.dirDown} · ${biState === 'confirmed' ? ui.confirmed : ui.unconfirmed}` : ui.noneStruct,
        lastBi && analysis.bi.length > 1 ? [ui.priorBi(analysis.bi.length - 1)] : [],
      ),
    );
    const segState = segmentConfirmation(lastSeg);
    list.append(
      stateRow(
        termButton('seg', ui.stateSeg),
        lastSeg
          ? `${lastSeg.direction === 'up' ? ui.dirUp : ui.dirDown} · ${segState === 'confirmed' ? ui.confirmed : ui.unconfirmed}`
          : ui.noneStruct,
      ),
    );
    if (!latest || close === undefined) {
      const subs = [teachingNote, gapShown ? null : ui.noHubBody].filter((item): item is string => Boolean(item));
      list.append(stateRow(termButton('zs', ui.stateZs), ui.noneStruct, subs));
    } else {
      const place = priceBand(close, latest.zd, latest.zg);
      const placeText = place === 'above' ? ui.priceAbove : place === 'below' ? ui.priceBelow : ui.priceInside;
      const prices = document.createElement('span');
      prices.append(
        termButton('zg', ui.zg),
        document.createTextNode(` ${formatPrice(latest.zg)} — `),
        termButton('zd', ui.zd),
        document.createTextNode(` ${formatPrice(latest.zd)} · ${placeText}`),
      );
      const subs = [
        `${ui.status(latest.status, latest.extended, latest.level)} · ${formatDay(latest.startTime)} → ${formatDay(latest.endTime)}`,
        teachingNote,
      ].filter((item): item is string => Boolean(item));
      list.append(stateRow(termButton('zs', ui.stateZs), prices, subs));
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

  function renderList(hubs: Hub[], marks: Mark[], gap: StructureGapModel): void {
    const ui = text();
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.hubId : undefined;
    hubList.replaceChildren();
    if (hubs.length === 0 && gap.show) {
      const empty = element('div', 'hub-empty');
      empty.id = 'hub-empty';
      empty.append(element('h3', undefined, gap.title), element('p', undefined, gap.body));
      hubList.append(empty);
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
      const zd = element('span', 'zg', `${ui.zd} ${formatPrice(hub.zd)}`);
      const zg = element('span', 'zg', `${ui.zg} ${formatPrice(hub.zg)}`);
      const dd = element('span', undefined, `${ui.dd} ${formatPrice(hub.dd)}`);
      const gg = element('span', undefined, `${ui.gg} ${formatPrice(hub.gg)}`);
      const zdText = gloss('zd')?.text;
      const zgText = gloss('zg')?.text;
      const ddText = gloss('dd')?.text;
      const ggText = gloss('gg')?.text;
      if (zdText) zd.title = zdText;
      if (zgText) zg.title = zgText;
      if (ddText) dd.title = ddText;
      if (ggText) gg.title = ggText;
      prices.append(zd, zg, dd, gg);
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

  async function loadLive(symbol: string, requestedTf: Timeframe = timeframe): Promise<void> {
    const serial = ++requestSerial;
    session = requestQuote(session, symbol, requestedTf);
    paint(false);
    try {
      const quote = await fetchPublicQuote(symbol, requestedTf);
      if (serial !== requestSerial) return;
      timeframe = requestedTf;
      session = acceptQuote(session, quote.symbol, quote.source, requestedTf);
      rawBars = quote.bars;
      useBars(quote.bars, true);
    } catch (error) {
      if (serial !== requestSerial) return;
      const reasons = error instanceof QuoteError ? error.reasons : [error instanceof Error ? error.message : 'failed'];
      const badSymbol = reasons.length === 1 && reasons[0] === 'symbol';
      timeframe = requestedTf;
      session = rejectQuote(
        session,
        symbol,
        requestedTf,
        reasons.filter((reason) => reason !== 'symbol'),
        badSymbol ? 'bad-symbol' : 'quote',
      );
      rawBars = currentFixture().bars;
      useBars(rawBars, true);
    }
  }

  symbolSelect.addEventListener('change', () => {
    const value = symbolSelect.value;
    if (value.startsWith('fixture:')) {
      requestSerial += 1;
      session = chooseLesson(value.slice('fixture:'.length));
      rawBars = currentFixture().bars;
      useBars(rawBars, true);
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
      const liveSymbol = session.attempt.status === 'loading' ? session.attempt.symbol : session.quote?.symbol ?? null;
      if (liveSymbol) {
        void loadLive(liveSymbol, next);
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
      requestSerial += 1;
      session = noteEmptySymbol(session, timeframe);
      paint(false);
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

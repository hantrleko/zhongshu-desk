import type { Fixture } from '../data/fixtures.ts';
import type { Timeframe } from '../data/resample.ts';
import type { Analysis, HubLevel, Segment } from '../engine/types.ts';
import { formatBarTime } from '../format.ts';
import { copy, type Lang } from '../i18n.ts';
import { shownIdentity, type Session } from './session.ts';

export interface ProvenanceModel {
  title: string;
  blurb: string;
  kindLabel: string;
  shownKind: 'lesson' | 'quote';
  shownId: string;
  requestedSymbol: string | null;
  /** A public read failed and the chart is the lesson, not the requested symbol. */
  fallback: boolean;
  pending: boolean;
  alert: string | null;
  source: string;
  range: string;
  fetchStatus: string;
  teachingPrices: boolean;
  teachingNote: string | null;
  /** One short line over the candles. The full record stays in the provenance block. */
  banner: string[];
  chartLabel: string;
}

export type GapCode = 'none' | 'no-stroke' | 'hub-short' | 'no-overlap' | 'segment-short' | 'no-segment';

export interface StructureGapModel {
  show: boolean;
  code: GapCode;
  title: string;
  body: string;
}

/** The last stroke can still extend. Earlier strokes are finished. */
export function strokeConfirmation(index: number, total: number): 'confirmed' | 'unconfirmed' | 'none' {
  if (total <= 0 || index < 0 || index >= total) return 'none';
  return index === total - 1 ? 'unconfirmed' : 'confirmed';
}

/** A segment is confirmed only when its feature-sequence fractal has ended it. */
export function segmentConfirmation(segment: Pick<Segment, 'finished'> | undefined): 'confirmed' | 'unconfirmed' | 'none' {
  if (!segment) return 'none';
  return segment.finished ? 'confirmed' : 'unconfirmed';
}

function timeframeName(lang: Lang, timeframe: Timeframe): string {
  return copy(lang).tfName(timeframe);
}

function loadingStatus(lang: Lang, session: Session, title: string): string {
  const ui = copy(lang);
  const attempt = session.attempt;
  if (attempt.status !== 'loading') return '';
  const tf = timeframeName(lang, attempt.timeframe);
  const shown = shownIdentity(session);
  if (shown.kind === 'lesson') return ui.provFetchLoadingLesson(attempt.symbol, tf, title);
  if (shown.symbol === attempt.symbol) return ui.provFetchLoadingSame(attempt.symbol, tf);
  return ui.provFetchLoadingOther(attempt.symbol, tf, shown.symbol);
}

export function presentProvenance(input: {
  lang: Lang;
  session: Session;
  timeframe: Timeframe;
  fixture: Pick<Fixture, 'title' | 'blurb'>;
  bars: readonly { time: number }[];
  hubCount: number;
}): ProvenanceModel {
  const ui = copy(input.lang);
  const shown = shownIdentity(input.session);
  const lessonTitle = input.fixture.title[input.lang];
  const title = shown.kind === 'quote' ? shown.symbol : lessonTitle;
  const shownId = shown.kind === 'quote' ? shown.symbol : input.session.fixtureId;
  const teachingPrices = shown.kind === 'lesson';
  const attempt = input.session.attempt;
  const requestedSymbol = attempt.status === 'idle' || attempt.symbol.length === 0 ? null : attempt.symbol;
  const fallback =
    shown.kind === 'lesson' && attempt.status === 'failed' && (attempt.kind === 'quote' || attempt.kind === 'bad-symbol');
  const pending = attempt.status === 'loading';

  let alert: string | null = null;
  if (attempt.status === 'failed' && attempt.kind === 'quote') alert = ui.provAlertFallback(attempt.symbol, lessonTitle);
  else if (attempt.status === 'failed' && attempt.kind === 'bad-symbol') alert = ui.provAlertBad(lessonTitle);
  else if (attempt.status === 'failed' && attempt.kind === 'empty-symbol') alert = ui.provAlertEmpty(title);

  const tf = timeframeName(input.lang, input.timeframe);
  let source: string;
  if (shown.kind === 'quote') source = ui.provSourceQuote(shown.source === 'yahoo' ? 'Yahoo' : 'Stooq', shown.symbol, tf);
  else if (input.timeframe === 'W') source = ui.provSourceLessonW;
  else if (input.timeframe !== 'D') source = ui.provSourceLessonIntraday(tf);
  else source = ui.provSourceLessonD;

  let range: string;
  if (input.bars.length === 0) range = ui.provRangeEmpty;
  else {
    const from = formatBarTime(input.bars[0].time);
    const latest = formatBarTime(input.bars[input.bars.length - 1].time);
    range =
      input.timeframe === 'W' && shown.kind === 'lesson'
        ? ui.provRangeWeekly(from, latest, input.bars.length, latest)
        : ui.provRange(from, latest, input.bars.length, latest);
  }

  let fetchStatus: string;
  if (attempt.status === 'idle') fetchStatus = ui.provFetchIdle;
  else if (attempt.status === 'loading') fetchStatus = loadingStatus(input.lang, input.session, title);
  else if (attempt.status === 'ready') {
    fetchStatus = ui.provFetchReady(
      attempt.source === 'yahoo' ? 'Yahoo' : 'Stooq',
      attempt.symbol,
      timeframeName(input.lang, attempt.timeframe),
    );
  } else if (attempt.kind === 'bad-symbol') fetchStatus = ui.provFetchBad;
  else if (attempt.kind === 'empty-symbol') fetchStatus = ui.provFetchEmpty;
  else {
    const reasons = attempt.reasons.filter(Boolean).join(input.lang === 'zh' ? '；' : '; ');
    fetchStatus = ui.provFetchFailed(attempt.symbol, timeframeName(input.lang, attempt.timeframe), reasons);
  }

  const teachingNote = !teachingPrices
    ? null
    : fallback && attempt.status === 'failed' && attempt.kind === 'quote'
      ? ui.provTeachingNot(attempt.symbol)
      : ui.provTeaching;

  const kindLabel =
    shown.kind === 'quote' ? ui.kindQuote : fallback && requestedSymbol ? ui.kindFallback(requestedSymbol) : ui.kindLesson;

  const banner: string[] = [];
  if (pending) banner.push(fetchStatus);
  else if (alert) banner.push(alert);

  let chartLabel: string;
  if (fallback && attempt.status === 'failed' && attempt.kind === 'quote') {
    chartLabel = ui.chartSummaryFallback(title, attempt.symbol, input.hubCount);
  } else if (shown.kind === 'quote') chartLabel = ui.chartSummaryQuote(title, input.hubCount);
  else chartLabel = ui.chartSummary(title, input.hubCount);

  return {
    title,
    blurb: shown.kind === 'quote' ? ui.provQuoteBlurb : input.fixture.blurb[input.lang],
    kindLabel,
    shownKind: shown.kind,
    shownId,
    requestedSymbol,
    fallback,
    pending,
    alert,
    source,
    range,
    fetchStatus,
    teachingPrices,
    teachingNote,
    banner,
    chartLabel,
  };
}

const emptyGap: StructureGapModel = { show: false, code: 'none', title: '', body: '' };

/**
 * Why the active level has no hub. This only describes the swings already computed.
 * It does not add strokes, segments, or hubs.
 */
export function presentStructureGap(input: {
  lang: Lang;
  level: HubLevel;
  barCount: number;
  analysis: Analysis;
}): StructureGapModel {
  const ui = copy(input.lang);
  const { analysis, level } = input;
  if (level === 'bi' && analysis.biHubs.length > 0) return emptyGap;
  if (level === 'segment' && analysis.segmentHubs.length > 0) return emptyGap;

  if (analysis.bi.length === 0) {
    return {
      show: true,
      code: 'no-stroke',
      title: ui.gapNoStrokeTitle,
      body: ui.gapNoStroke(input.barCount, analysis.merged.length),
    };
  }
  if (level === 'bi' && analysis.bi.length < 3) {
    return {
      show: true,
      code: 'hub-short',
      title: ui.gapHubShortTitle,
      body: ui.gapHubShort(ui.gapUnitBi, analysis.bi.length),
    };
  }
  if (level === 'bi') {
    return {
      show: true,
      code: 'no-overlap',
      title: ui.gapNoOverlapTitle,
      body: ui.gapNoOverlap(ui.gapUnitBi, analysis.bi.length),
    };
  }
  if (analysis.segments.length === 0) {
    return {
      show: true,
      code: 'no-segment',
      title: ui.gapNoSegmentTitle,
      body: ui.gapNoSegment(analysis.bi.length),
    };
  }
  if (analysis.segments.length < 3) {
    const finished = analysis.segments.filter((segment) => segment.finished).length;
    return {
      show: true,
      code: 'segment-short',
      title: ui.gapSegmentShortTitle,
      body: ui.gapSegmentShort(analysis.segments.length, finished, analysis.segments.length - finished),
    };
  }
  return {
    show: true,
    code: 'no-overlap',
    title: ui.gapNoOverlapTitle,
    body: ui.gapNoOverlap(ui.gapUnitSeg, analysis.segments.length),
  };
}

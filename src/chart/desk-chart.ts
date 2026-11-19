import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPaneApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { MacdPoint } from '../data/indicators.ts';
import type { Bar, Bi, Hub, Mark, Segment } from '../engine/types.ts';
import { markAnchor, markChartLabel, partitionLastSwing } from '../ui/clarity.ts';
import { HubPrimitive, type ChartLabels, type DrawnMark } from './hub-primitive.ts';

export interface MaLineInput {
  period: number;
  color: string;
  points: Array<{ time: number; value: number }>;
}

export interface ChartSeriesInput {
  bars: Bar[];
  bi: Bi[];
  segments: Segment[];
  fit: boolean;
  ma?: MaLineInput[];
  volume?: Array<{ time: number; value: number; up: boolean }>;
  macd?: MacdPoint[];
}

export interface ChartOverlayInput {
  hubs: Hub[];
  marks: Mark[];
  selectedId: string | null;
  labels: ChartLabels;
  fontFamily: string;
  swings?: DrawnMark[];
}

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function stamp(time: number): UTCTimestamp {
  return time as UTCTimestamp;
}

/** Keep price ticks at 2 decimals, but do not force that on volume scales. */
function formatAxisNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}


function linePoints(items: Array<{ startTime: number; endTime: number; startPrice: number; endPrice: number }>): LineData[] {
  if (items.length === 0) return [];
  const points: LineData[] = [{ time: stamp(items[0].startTime), value: items[0].startPrice }];
  for (const item of items) {
    const previous = points[points.length - 1];
    if (item.endTime <= Number(previous.time)) continue;
    points.push({ time: stamp(item.endTime), value: item.endPrice });
  }
  return points.length >= 2 ? points : [];
}

const UP = '#26c6b0';
const DOWN = '#ef5350';
const MACD = '#d6c07a';
const SIGNAL = '#7aa2ff';

/**
 * The chart pane. The TradingView attribution logo is off because the page footer
 * carries the required link to tradingview.com and the Lightweight Charts notice.
 * This is not the TradingView Charting Library.
 */
export class DeskChart {
  private readonly chart: IChartApi;
  private readonly candles: ISeriesApi<'Candlestick'>;
  private readonly segments: ISeriesApi<'Line'>;
  private readonly openSegments: ISeriesApi<'Line'>;
  private readonly strokes: ISeriesApi<'Line'>;
  private readonly openStrokes: ISeriesApi<'Line'>;
  private readonly maSeries: Map<number, ISeriesApi<'Line'>> = new Map();
  private readonly hubs: HubPrimitive;
  private volume: ISeriesApi<'Histogram'> | null = null;
  private macdHist: ISeriesApi<'Histogram'> | null = null;
  private macdLine: ISeriesApi<'Line'> | null = null;
  private macdSignal: ISeriesApi<'Line'> | null = null;
  private token = '';
  private lineToken = '';

  constructor(container: HTMLElement, onSelect: (id: string) => void) {
    const bg = cssVar('--bg', '#07080a');
    const text = cssVar('--text', '#e8eaed');
    const grid = cssVar('--grid', '#161a20');
    const line = cssVar('--line', '#1c2128');
    const up = cssVar('--up', UP);
    const down = cssVar('--down', DOWN);
    const stroke = '#f3f4f6';
    const segment = '#5b8def';
    const font = cssVar('--sans', 'sans-serif');

    this.chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontFamily: font,
        fontSize: 11,
        attributionLogo: false,
        panes: { separatorColor: line, separatorHoverColor: '#2a313a', enableResize: true },
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      rightPriceScale: { borderColor: line, scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderColor: line, rightOffset: 8, barSpacing: 16, minBarSpacing: 5 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#6b7280', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1a1d22' },
        horzLine: { color: '#6b7280', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1a1d22' },
      },
      localization: { priceFormatter: formatAxisNumber },
    });

    this.candles = this.chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderUpColor: up,
      borderDownColor: down,
      wickUpColor: up,
      wickDownColor: down,
      borderVisible: true,
    });
    this.hubs = new HubPrimitive();
    this.candles.attachPrimitive(this.hubs);
    this.segments = this.chart.addSeries(LineSeries, {
      color: segment,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    this.openSegments = this.chart.addSeries(LineSeries, {
      color: 'rgba(91, 141, 239, 0.55)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    this.strokes = this.chart.addSeries(LineSeries, {
      color: stroke,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    this.openStrokes = this.chart.addSeries(LineSeries, {
      color: 'rgba(243, 244, 246, 0.85)',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    this.chart.subscribeClick((param) => {
      const id = param.hoveredInfo?.objectId ?? param.hoveredObjectId;
      if (typeof id === 'string') onSelect(id);
    });
  }

  setLocale(locale: string): void {
    this.chart.applyOptions({
      localization: { locale, priceFormatter: formatAxisNumber },
    });
  }

  setSeries(input: ChartSeriesInput): void {
    const last = input.bars[input.bars.length - 1];
    const token = `${input.bars.length}:${input.bars[0]?.time ?? 0}:${last?.time ?? 0}:${last?.close ?? 0}`;
    const changed = token !== this.token;
    if (changed) {
      this.token = token;
      this.candles.setData(
        input.bars.map((bar) => ({
          time: stamp(bar.time),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        })),
      );
    }
    const finishedCount = input.segments.filter((item) => item.finished).length;
    const parts = partitionLastSwing(input.bi);
    const lineToken = `${token}|bi:${parts.confirmed.length}:${parts.unconfirmed.length}|seg:${input.segments.length}:${finishedCount}`;
    if (lineToken !== this.lineToken) {
      this.lineToken = lineToken;
      this.strokes.setData(linePoints(parts.confirmed));
      this.openStrokes.setData(linePoints(parts.unconfirmed));
      this.segments.setData(linePoints(input.segments.filter((item) => item.finished)));
      this.openSegments.setData(linePoints(input.segments.filter((item) => !item.finished)));
    }
    this.syncMa(input.ma ?? []);
    this.syncPanes(input.volume ?? [], input.macd ?? []);
    if (input.fit && input.bars.length > 0) this.chart.timeScale().fitContent();
  }

  setOverlay(input: ChartOverlayInput): void {
    const latestId = input.hubs[input.hubs.length - 1]?.id ?? null;
    const swings = input.swings ?? [];
    this.hubs.setScene(
      input.hubs.map((hub) => ({
        id: hub.id,
        startTime: hub.startTime,
        endTime: hub.endTime,
        zg: hub.zg,
        zd: hub.zd,
        latest: hub.id === latestId,
        selected: hub.id === input.selectedId,
      })),
      input.marks.map((mark) => ({
        time: mark.time,
        price: mark.price,
        label: markChartLabel(mark.kind, input.labels),
        anchor: markAnchor(mark.kind),
      })),
      input.labels,
      input.fontFamily,
      swings,
    );
  }

  reveal(startTime: number, endTime: number): void {
    const span = Math.max(endTime - startTime, 5 * 86_400);
    const pad = span * 0.45;
    try {
      this.chart.timeScale().setVisibleRange({ from: stamp(startTime - pad), to: stamp(endTime + pad) });
    } catch {
      // A range outside the series is left as the chart drew it.
    }
  }

  private syncMa(lines: MaLineInput[]): void {
    const keep = new Set(lines.map((line) => line.period));
    for (const [period, series] of this.maSeries) {
      if (keep.has(period)) continue;
      this.chart.removeSeries(series);
      this.maSeries.delete(period);
    }
    for (const line of lines) {
      let series = this.maSeries.get(line.period);
      if (!series) {
        series = this.chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          title: `MA${line.period}`,
        });
        this.maSeries.set(line.period, series);
      } else {
        series.applyOptions({ color: line.color });
      }
      series.setData(line.points.map((point) => ({ time: stamp(point.time), value: point.value })));
    }
  }

  private syncPanes(
    volume: Array<{ time: number; value: number; up: boolean }>,
    macd: MacdPoint[],
  ): void {
    this.ensureSubPanes(volume.length > 0, macd.length > 0);
    if (this.volume) {
      this.volume.setData(
        volume.map((point) => ({
          time: stamp(point.time),
          value: point.value,
          color: point.up ? 'rgba(38, 198, 176, 0.72)' : 'rgba(239, 83, 80, 0.72)',
        })),
      );
    }
    if (this.macdHist && this.macdLine && this.macdSignal) {
      this.macdHist.setData(
        macd.map((point) => ({
          time: stamp(point.time),
          value: point.histogram,
          color: point.histogram >= 0 ? 'rgba(38, 198, 176, 0.7)' : 'rgba(239, 83, 80, 0.7)',
        })),
      );
      this.macdLine.setData(macd.map((point) => ({ time: stamp(point.time), value: point.macd })));
      this.macdSignal.setData(macd.map((point) => ({ time: stamp(point.time), value: point.signal })));
    }
    this.layoutPanes(volume.length > 0, macd.length > 0);
  }

  private ensureSubPanes(wantVolume: boolean, wantMacd: boolean): void {
    if (wantVolume && !this.volume) {
      this.volume = this.chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: 'volume' },
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'VOL',
        },
        1,
      );
    }
    if (!wantVolume && this.volume) {
      this.chart.removeSeries(this.volume);
      this.volume = null;
    }
    if (wantMacd && !this.macdHist) {
      const paneIndex = this.chart.panes().length > 1 && this.volume ? 2 : 1;
      this.macdHist = this.chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false, title: 'MACD(12,26,9)' },
        paneIndex,
      );
      this.macdLine = this.chart.addSeries(
        LineSeries,
        { color: MACD, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, title: 'DIF' },
        paneIndex,
      );
      this.macdSignal = this.chart.addSeries(
        LineSeries,
        { color: SIGNAL, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, title: 'DEA' },
        paneIndex,
      );
    }
    if (!wantMacd && this.macdHist) {
      this.chart.removeSeries(this.macdHist);
      if (this.macdLine) this.chart.removeSeries(this.macdLine);
      if (this.macdSignal) this.chart.removeSeries(this.macdSignal);
      this.macdHist = null;
      this.macdLine = null;
      this.macdSignal = null;
    }
  }

  private layoutPanes(hasVolume: boolean, hasMacd: boolean): void {
    const panes = this.chart.panes();
    const main: IPaneApi<Time> | undefined = panes[0];
    if (!main) return;
    if (!hasVolume && !hasMacd) {
      main.setStretchFactor(1);
      return;
    }
    main.setStretchFactor(3.2);
    let index = 1;
    if (hasVolume && panes[index]) {
      panes[index].setStretchFactor(0.7);
      index += 1;
    }
    if (hasMacd && panes[index]) panes[index].setStretchFactor(0.8);
  }
}

export function structureSwingLabels(
  bi: readonly Bi[],
  segments: readonly Segment[],
  labels: Pick<ChartLabels, 'stroke' | 'segment'>,
): DrawnMark[] {
  const marks: DrawnMark[] = [];
  const lastBi = bi[bi.length - 1];
  if (lastBi && labels.stroke) {
    marks.push({
      time: lastBi.endTime,
      price: lastBi.endPrice,
      label: labels.stroke,
      anchor: lastBi.direction === 'up' ? 'above' : 'below',
    });
  }
  const lastSeg = segments[segments.length - 1];
  if (lastSeg && labels.segment) {
    const same = marks.find((mark) => mark.time === lastSeg.endTime && mark.price === lastSeg.endPrice);
    if (same) same.label = `${same.label} / ${labels.segment}`;
    else {
      marks.push({
        time: lastSeg.endTime,
        price: lastSeg.endPrice,
        label: labels.segment,
        anchor: lastSeg.direction === 'up' ? 'above' : 'below',
      });
    }
  }
  return marks;
}

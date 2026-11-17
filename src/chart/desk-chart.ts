import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Bar, Bi, Hub, Mark, Segment } from '../engine/types.ts';
import { HubPrimitive, type ChartLabels } from './hub-primitive.ts';

export interface ChartSeriesInput {
  bars: Bar[];
  bi: Bi[];
  segments: Segment[];
  fit: boolean;
}

export interface ChartOverlayInput {
  hubs: Hub[];
  marks: Mark[];
  selectedId: string | null;
  labels: ChartLabels;
  fontFamily: string;
}

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function stamp(time: number): UTCTimestamp {
  return time as UTCTimestamp;
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
  private readonly hubs: HubPrimitive;
  private token = '';
  private lineToken = '';

  constructor(container: HTMLElement, onSelect: (id: string) => void) {
    const bg = cssVar('--bg', '#10140f');
    const text = cssVar('--text', '#e6e1d6');
    const grid = cssVar('--grid', '#243026');
    const line = cssVar('--line', '#3a4438');
    const up = cssVar('--up', '#d2584c');
    const down = cssVar('--down', '#3f8f78');
    const stroke = '#f4f4f4';
    const segment = '#5b8def';
    const font = cssVar('--sans', 'sans-serif');

    this.chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontFamily: font,
        fontSize: 12,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      rightPriceScale: { borderColor: line },
      timeScale: { borderColor: line, rightOffset: 4, barSpacing: 9, minBarSpacing: 3 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#8a8070', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#3a3428' },
        horzLine: { color: '#8a8070', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#3a3428' },
      },
      localization: { priceFormatter: (price: number) => price.toFixed(2) },
    });

    this.candles = this.chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderUpColor: up,
      borderDownColor: down,
      wickUpColor: up,
      wickDownColor: down,
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

    this.chart.subscribeClick((param) => {
      const id = param.hoveredInfo?.objectId ?? param.hoveredObjectId;
      if (typeof id === 'string') onSelect(id);
    });
  }

  setLocale(locale: string): void {
    this.chart.applyOptions({
      localization: { locale, priceFormatter: (price: number) => price.toFixed(2) },
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
    const lineToken = `${token}|bi:${input.bi.length}|seg:${input.segments.length}:${finishedCount}`;
    if (lineToken !== this.lineToken) {
      this.lineToken = lineToken;
      this.strokes.setData(linePoints(input.bi));
      this.segments.setData(linePoints(input.segments.filter((item) => item.finished)));
      this.openSegments.setData(linePoints(input.segments.filter((item) => !item.finished)));
    }
    if (input.fit && input.bars.length > 0) this.chart.timeScale().fitContent();
  }

  setOverlay(input: ChartOverlayInput): void {
    const latestId = input.hubs[input.hubs.length - 1]?.id ?? null;
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
      input.marks.map((mark) => ({ time: mark.time, price: mark.price, label: '3' })),
      input.labels,
      input.fontFamily,
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
}

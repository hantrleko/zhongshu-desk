import type {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  PrimitiveHoveredItem,
  SeriesAttachedParameter,
  SeriesType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';

export interface DrawnHub {
  id: string;
  startTime: number;
  endTime: number;
  zg: number;
  zd: number;
  latest: boolean;
  selected: boolean;
}

export interface DrawnMark {
  time: number;
  price: number;
  /** Buy or sell word, placed beside the peak or valley. */
  label: string;
  /** Sell labels sit above a peak; buy labels sit below a valley. */
  anchor: 'above' | 'below';
  /** Provisional marks on the unconfirmed tail swing draw hollow and dashed. */
  pending?: boolean;
}

export interface ChartLabels {
  latest: string;
  selected: string;
  zg: string;
  zd: string;
  buy: string;
  sell: string;
  hub: string;
  stroke: string;
  segment: string;
}

interface MediaBox {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  latest: boolean;
  selected: boolean;
  zg: number;
  zd: number;
}

interface MediaMark {
  x: number;
  y: number;
  text: string;
  anchor: 'above' | 'below';
  tone?: 'mark' | 'swing';
  pending?: boolean;
}

const EMPTY_LABELS: ChartLabels = { latest: '', selected: '', zg: 'ZG', zd: 'ZD', buy: '', sell: '', hub: '', stroke: '', segment: '' };

class HubRenderer implements IPrimitivePaneRenderer {
  private readonly host: HubPrimitive;

  constructor(host: HubPrimitive) {
    this.host = host;
  }

  drawBackground(target: Parameters<IPrimitivePaneRenderer['draw']>[0]): void {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      for (const box of this.host.boxes) {
        const left = Math.round(box.left * scope.horizontalPixelRatio);
        const top = Math.round(box.top * scope.verticalPixelRatio);
        const width = Math.max(1, Math.round(box.width * scope.horizontalPixelRatio));
        const height = Math.max(1, Math.round(box.height * scope.verticalPixelRatio));
        ctx.fillStyle = box.selected ? 'rgba(214, 218, 224, 0.22)' : box.latest ? 'rgba(176, 182, 190, 0.16)' : 'rgba(120, 130, 150, 0.10)';
        ctx.fillRect(left, top, width, height);
      }
    });
  }

  draw(target: Parameters<IPrimitivePaneRenderer['draw']>[0]): void {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hx = scope.horizontalPixelRatio;
      const vx = scope.verticalPixelRatio;
      ctx.font = `${Math.round(13 * vx)}px ${this.host.fontFamily}`;
      ctx.textBaseline = 'top';
      for (const box of this.host.boxes) {
        const left = Math.round(box.left * hx);
        const top = Math.round(box.top * vx);
        const width = Math.max(1, Math.round(box.width * hx));
        const height = Math.max(1, Math.round(box.height * vx));
        ctx.strokeStyle = box.selected ? '#e6e8ec' : box.latest ? '#c5cad3' : '#9aa3ad';
        ctx.lineWidth = (box.selected || box.latest ? 2 : 1) * Math.max(1, vx);
        ctx.setLineDash([5 * hx, 4 * hx]);
        ctx.strokeRect(left + 0.5, top + 0.5, Math.max(0, width - 1), Math.max(0, height - 1));
        ctx.setLineDash([]);
        const parts = [this.host.labels.hub, box.latest ? this.host.labels.latest : '', box.selected ? this.host.labels.selected : ''].filter(Boolean);
        const tag = parts.join(' · ');
        if (tag && width > 28 * hx && height > 14 * vx) {
          const padX = 5 * hx;
          const padY = 3 * vx;
          const textWidth = ctx.measureText(tag).width;
          ctx.fillStyle = 'rgba(7, 8, 10, 0.88)';
          ctx.fillRect(left + padX, top + padY, textWidth + padX * 2, 15 * vx);
          ctx.fillStyle = '#e8eaed';
          ctx.fillText(tag, left + padX * 1.4, top + padY + vx);
        }
        if (width > 88 * hx && height > 40 * vx && (box.latest || box.selected)) {
          const zg = `${this.host.labels.zg} ${box.zg.toFixed(2)}`;
          const zd = `${this.host.labels.zd} ${box.zd.toFixed(2)}`;
          ctx.fillStyle = '#d7dbe3';
          ctx.fillText(zg, left + width - ctx.measureText(zg).width - 6 * hx, top + 4 * vx);
          ctx.fillText(zd, left + width - ctx.measureText(zd).width - 6 * hx, top + height - 16 * vx);
        }
      }
      ctx.font = `${Math.round(12 * vx)}px ${this.host.fontFamily}`;
      ctx.textBaseline = 'top';
      for (const mark of this.host.markDots) {
        const x = Math.round(mark.x * hx);
        const y = Math.round(mark.y * vx);
        const padX = 4 * hx;
        const padY = 2 * vx;
        const textWidth = ctx.measureText(mark.text).width;
        const boxW = textWidth + padX * 2;
        const boxH = 16 * vx;
        const boxX = x + 6 * hx;
        const boxY = mark.anchor === 'below' ? y + 6 * vx : y - boxH - 6 * vx;
        ctx.strokeStyle = mark.tone === 'swing' ? 'rgba(180, 188, 200, 0.7)' : '#c5cad3';
        ctx.lineWidth = Math.max(1, vx);
        ctx.beginPath();
        ctx.moveTo(x, y - 3 * vx);
        ctx.lineTo(x, y + 3 * vx);
        ctx.stroke();
        ctx.fillStyle = 'rgba(7, 8, 10, 0.9)';
        ctx.strokeStyle = mark.tone === 'swing' ? 'rgba(140, 170, 230, 0.95)' : 'rgba(220, 224, 232, 0.85)';
        ctx.beginPath();
        const r = 3 * Math.max(hx, vx);
        const right = boxX + boxW;
        const bottom = boxY + boxH;
        ctx.moveTo(boxX + r, boxY);
        ctx.lineTo(right - r, boxY);
        ctx.quadraticCurveTo(right, boxY, right, boxY + r);
        ctx.lineTo(right, bottom - r);
        ctx.quadraticCurveTo(right, bottom, right - r, bottom);
        ctx.lineTo(boxX + r, bottom);
        ctx.quadraticCurveTo(boxX, bottom, boxX, bottom - r);
        ctx.lineTo(boxX, boxY + r);
        ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
        if (mark.pending) {
          ctx.fillStyle = 'rgba(7, 8, 10, 0.45)';
          ctx.fill();
          ctx.fillStyle = 'rgba(7, 8, 10, 0.9)';
          ctx.setLineDash([4 * hx, 3 * hx]);
        } else {
          ctx.fill();
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = mark.tone === 'swing' ? '#dce6fb' : '#f3f4f6';
        ctx.fillText(mark.text, boxX + padX, boxY + padY);
      }
    });
  }
}

class HubPaneView implements IPrimitivePaneView {
  private readonly paneRenderer: HubRenderer;

  constructor(host: HubPrimitive) {
    this.paneRenderer = new HubRenderer(host);
  }

  zOrder(): 'normal' {
    return 'normal';
  }

  renderer(): IPrimitivePaneRenderer {
    return this.paneRenderer;
  }
}

/** Hub bands and quiet third-class labels. The band is the thing to see. */
export class HubPrimitive implements ISeriesPrimitive<Time> {
  boxes: MediaBox[] = [];
  markDots: MediaMark[] = [];
  labels: ChartLabels = EMPTY_LABELS;
  fontFamily = 'sans-serif';

  private hubs: DrawnHub[] = [];
  private marks: DrawnMark[] = [];
  private swings: DrawnMark[] = [];
  private chart: SeriesAttachedParameter<Time>['chart'] | null = null;
  private series: ISeriesApi<SeriesType, Time> | null = null;
  private requestUpdate: (() => void) | undefined;
  private readonly paneView = new HubPaneView(this);

  attached(param: SeriesAttachedParameter<Time>): void {
    this.chart = param.chart;
    this.series = param.series;
    this.requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this.chart = null;
    this.series = null;
    this.requestUpdate = undefined;
  }

  setScene(hubs: DrawnHub[], marks: DrawnMark[], labels: ChartLabels, fontFamily: string, swings: DrawnMark[] = []): void {
    this.hubs = hubs;
    this.marks = marks;
    this.swings = swings;
    this.labels = labels;
    this.fontFamily = fontFamily;
    this.requestUpdate?.();
  }

  updateAllViews(): void {
    const boxes: MediaBox[] = [];
    const markDots: MediaMark[] = [];
    if (this.chart && this.series) {
      const scale = this.chart.timeScale();
      for (const hub of this.hubs) {
        const x1 = scale.timeToCoordinate(hub.startTime as UTCTimestamp);
        const x2 = scale.timeToCoordinate(hub.endTime as UTCTimestamp);
        const yHigh = this.series.priceToCoordinate(hub.zg);
        const yLow = this.series.priceToCoordinate(hub.zd);
        if (x1 === null || x2 === null || yHigh === null || yLow === null) continue;
        boxes.push({
          id: hub.id,
          left: Math.min(x1, x2),
          top: Math.min(yHigh, yLow),
          width: Math.max(Math.abs(x2 - x1), 6),
          height: Math.max(Math.abs(yLow - yHigh), 4),
          latest: hub.latest,
          selected: hub.selected,
          zg: hub.zg,
          zd: hub.zd,
        });
      }
      for (const mark of this.marks) {
        const x = scale.timeToCoordinate(mark.time as UTCTimestamp);
        const y = this.series.priceToCoordinate(mark.price);
        if (x === null || y === null) continue;
        markDots.push({ x, y, text: mark.label, anchor: mark.anchor, tone: 'mark', pending: mark.pending });
      }
      for (const mark of this.swings) {
        const x = scale.timeToCoordinate(mark.time as UTCTimestamp);
        const y = this.series.priceToCoordinate(mark.price);
        if (x === null || y === null) continue;
        markDots.push({ x, y, text: mark.label, anchor: mark.anchor, tone: 'swing' });
      }
    }
    this.boxes = boxes;
    this.markDots = markDots;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.paneView];
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    for (let i = this.boxes.length - 1; i >= 0; i -= 1) {
      const box = this.boxes[i];
      if (x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height) {
        return { externalId: box.id, cursorStyle: 'pointer', zOrder: 'normal' };
      }
    }
    return null;
  }
}

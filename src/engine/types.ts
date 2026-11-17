export type Direction = 'up' | 'down';

/** One raw OHLC bar. `time` is Unix seconds and must increase. */
export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * A bar after inclusion (包含). Several raw bars may have been folded in.
 * `direction` is the relationship to the previous surviving merged bar.
 */
export interface MergedBar {
  time: number;
  endTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  startIndex: number;
  endIndex: number;
  direction: Direction | 'flat';
  rawCount: number;
}

export interface Fractal {
  type: 'top' | 'bottom';
  /** Index into the merged-bar array. */
  index: number;
  time: number;
  endTime: number;
  high: number;
  low: number;
  /** Top: high. Bottom: low. */
  extreme: number;
}

export interface Bi {
  id: string;
  direction: Direction;
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number;
  high: number;
  low: number;
}

export interface Segment {
  id: string;
  direction: Direction;
  startBi: number;
  endBi: number;
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number;
  /** Union of member strokes, not only the two endpoints. */
  high: number;
  low: number;
  /** False when the series ended before a feature-sequence fractal. */
  finished: boolean;
  biIds: string[];
}

export type HubLevel = 'bi' | 'segment';
export type HubStatus = 'active' | 'left-up' | 'left-down';

export interface Hub {
  id: string;
  level: HubLevel;
  startTime: number;
  endTime: number;
  /** Index of the first member swing in that level's array. */
  startSwing: number;
  /** Index of the last member swing, inclusive. */
  endSwing: number;
  /** Fixed by the first three swings. */
  zg: number;
  zd: number;
  /** Highest high and lowest low across every member. */
  gg: number;
  dd: number;
  memberIds: string[];
  status: HubStatus;
  /** More than the three core swings. */
  extended: boolean;
  /** Direction of the first member swing. */
  enterDirection: Direction;
  leaveDirection: Direction | 'none';
}

/** A quiet structural label. Not a trade signal. */
export interface Mark {
  kind: 'buy3' | 'sell3';
  time: number;
  price: number;
  hubId: string;
  level: HubLevel;
}

export interface Analysis {
  merged: MergedBar[];
  fractals: Fractal[];
  bi: Bi[];
  segments: Segment[];
  biHubs: Hub[];
  segmentHubs: Hub[];
  biMarks: Mark[];
  segmentMarks: Mark[];
}

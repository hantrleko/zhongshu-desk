import type { Bar } from '../engine/types.ts';
import { synthesize } from './synthesize.ts';

export interface Fixture {
  id: string;
  title: { zh: string; en: string };
  blurb: { zh: string; en: string };
  /** Alternating extremes, first one a bottom. The OHLC is `synthesize(turns)`. */
  turns: readonly number[];
  bars: Bar[];
}

/**
 * Lesson 1. One extended bi hub, then a leave upward and a third-class buy label.
 * Turns are bottoms and tops. Wick is ±0.5, so the hub is ZD 107.5 / ZG 128.5.
 */
const singleTurns = [100, 132, 108, 128, 112, 124, 116, 140, 132, 156] as const;

/**
 * Lesson 2. The first hub leaves upward. The next three strokes overlap higher up.
 * Members are not shared. The price zones do not overlap.
 */
const twoTurns = [80, 128, 100, 120, 112, 148, 132, 160, 140] as const;

/** Lesson 3. Two strokes only. A hub needs a third overlapping stroke. */
const noneTurns = [50, 74, 62] as const;

export const fixtures: readonly Fixture[] = [
  {
    id: 'single-hub',
    title: { zh: '样例一 · 一个中枢', en: 'Lesson 1 · one hub' },
    blurb: {
      zh: '价格在一个区间里来回，三笔重叠成中枢，后面几笔仍和区间相交，中枢延伸。随后一笔整体抬到 ZG 之上，中枢向上离开，低点旁有一个三买标注。',
      en: 'Price oscillates, three strokes overlap into a hub, and later strokes still touch that band, so the hub extends. One stroke then sits entirely above ZG. The hub has left upward, and the low carries a third-class buy label.',
    },
    turns: singleTurns,
    bars: synthesize(singleTurns),
  },
  {
    id: 'two-hubs',
    title: { zh: '样例二 · 相邻中枢', en: 'Lesson 2 · adjacent hubs' },
    blurb: {
      zh: '第一个中枢向上离开之后，更高的位置又有三笔重叠，形成第二个中枢。两个中枢在时间上相接，成员不共用，价格区间也不重叠。',
      en: 'After the first hub leaves upward, three strokes overlap higher up and form a second hub. The hubs meet in time. They do not share members, and their price bands do not overlap.',
    },
    turns: twoTurns,
    bars: synthesize(twoTurns),
  },
  {
    id: 'no-hub',
    title: { zh: '样例三 · 尚未成枢', en: 'Lesson 3 · no hub yet' },
    blurb: {
      zh: '这里只有两笔。没有第三笔参与重叠，所以没有中枢。分型和笔仍然画着，它们是看见中枢的手段，本身还不是中枢。',
      en: 'There are only two strokes. Without a third stroke in the overlap, there is no hub. Fractals and strokes are still drawn. They are ways of seeing a hub, not the hub itself.',
    },
    turns: noneTurns,
    bars: synthesize(noneTurns),
  },
];

export function fixtureById(id: string): Fixture | undefined {
  return fixtures.find((fixture) => fixture.id === id);
}

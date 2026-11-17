import { describe, expect, it } from 'vitest';
import { findHubs, type Swing } from '../src/engine/hub.ts';
import { findThirdClass } from '../src/engine/marks.ts';
import { buildSegments } from '../src/engine/segment.ts';
import type { Bi, Direction } from '../src/engine/types.ts';

function stroke(index: number, direction: Direction, startPrice: number, endPrice: number): Bi {
  const high = Math.max(startPrice, endPrice);
  const low = Math.min(startPrice, endPrice);
  const startTime = 1_700_000_000 + index * 86_400;
  return {
    id: `bi-${index + 1}`,
    direction,
    startIndex: index * 5,
    endIndex: index * 5 + 4,
    startTime,
    endTime: startTime + 86_400,
    startPrice,
    endPrice,
    high,
    low,
  };
}

/** Enough strokes for two finished segments and one unfinished tail. Same shape as the segment tests. */
const lesson: Bi[] = [
  stroke(0, 'up', 10, 20),
  stroke(1, 'down', 20, 14),
  stroke(2, 'up', 14, 24),
  stroke(3, 'down', 24, 18),
  stroke(4, 'up', 18, 23),
  stroke(5, 'down', 23, 14),
  stroke(6, 'up', 14, 19),
  stroke(7, 'down', 19, 16),
  stroke(8, 'up', 16, 22),
];

describe('segment hubs from the existing rules', () => {
  it('keeps ZG and ZD on three overlapping segments, including an unfinished tail', () => {
    const segments = buildSegments(lesson);
    expect(segments.map((segment) => segment.finished)).toEqual([true, true, false]);
    const hubs = findHubs(segments, 'segment');
    expect(hubs).toHaveLength(1);
    expect(hubs[0]).toMatchObject({
      level: 'segment',
      zg: 22,
      zd: 14,
      gg: 24,
      dd: 10,
      extended: false,
      status: 'active',
      leaveDirection: 'none',
      memberIds: ['seg-1', 'seg-2', 'seg-3'],
    });
    expect(findThirdClass(segments, hubs, 'segment')).toEqual([]);
  });

  it('does not treat a single shared price as a segment hub', () => {
    const swings: Swing[] = [
      { id: 'seg-1', direction: 'up', high: 10, low: 0, startTime: 1, endTime: 2 },
      { id: 'seg-2', direction: 'down', high: 20, low: 10, startTime: 2, endTime: 3 },
      { id: 'seg-3', direction: 'up', high: 10, low: 0, startTime: 3, endTime: 4 },
    ];
    expect(findHubs(swings, 'segment')).toEqual([]);
  });
});

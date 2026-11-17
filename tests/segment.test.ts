import { describe, expect, it } from 'vitest';
import { buildSegments, findSegmentEnd } from '../src/engine/segment.ts';
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

describe('segments', () => {
  it('ends an up segment on an ungapped feature-sequence top', () => {
    expect(findSegmentEnd(lesson, 0)).toBe(2);
  });

  it('builds two finished segments and one unfinished tail', () => {
    const segments = buildSegments(lesson);
    expect(segments.map((item) => [item.direction, item.startBi, item.endBi, item.finished])).toEqual([
      ['up', 0, 2, true],
      ['down', 3, 5, true],
      ['up', 6, 8, false],
    ]);
    expect(segments[0].high).toBe(24);
    expect(segments[0].low).toBe(10);
  });

  it('does not end a segment on a gapped fractal', () => {
    const gapped: Bi[] = [
      stroke(0, 'up', 10, 20),
      stroke(1, 'down', 20, 14),
      stroke(2, 'up', 14, 28),
      stroke(3, 'down', 28, 22),
      stroke(4, 'up', 22, 25),
      stroke(5, 'down', 25, 18),
    ];
    expect(findSegmentEnd(gapped, 0)).toBeNull();
    const segments = buildSegments(gapped);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ finished: false, startBi: 0, endBi: 4, direction: 'up' });
  });

  it('emits an unfinished segment when three strokes have no fractal yet', () => {
    const open = [stroke(0, 'up', 10, 20), stroke(1, 'down', 20, 14), stroke(2, 'up', 14, 22)];
    const segments = buildSegments(open);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ finished: false, startBi: 0, endBi: 2 });
  });

  it('returns nothing when there are fewer than three strokes', () => {
    expect(buildSegments([])).toEqual([]);
    expect(buildSegments([stroke(0, 'up', 1, 2), stroke(1, 'down', 2, 1)])).toEqual([]);
  });
});

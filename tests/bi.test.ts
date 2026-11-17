import { describe, expect, it } from 'vitest';
import { buildBi, canFormBi } from '../src/engine/bi.ts';
import { fractal, merged } from './helpers.ts';

function ladder(): ReturnType<typeof merged>[] {
  return [
    merged(0, 13, 11),
    merged(1, 12, 10),
    merged(2, 16, 13),
    merged(3, 18, 15),
    merged(4, 19, 16),
    merged(5, 22, 18),
    merged(6, 20, 17),
    merged(7, 21, 17.5),
    merged(8, 24, 19),
    merged(9, 30, 22),
    merged(10, 27, 21),
  ];
}

describe('bi', () => {
  const bars = ladder();
  const bottom = fractal('bottom', 1, 12, 10);
  const topNear = fractal('top', 4, 19, 16);
  const top = fractal('top', 5, 22, 18);
  const topLater = fractal('top', 9, 30, 22);

  it('rejects a center distance below 4 and accepts 4', () => {
    expect(canFormBi(bottom, topNear, bars)).toBe(false);
    expect(canFormBi(bottom, top, bars)).toBe(true);
  });

  it('rejects a tied high', () => {
    const tied = bars.map((bar) => ({ ...bar }));
    tied[3] = { ...tied[3], high: 22 };
    expect(canFormBi(bottom, top, tied)).toBe(false);
  });

  it('builds an up stroke between a bottom and a top', () => {
    const strokes = buildBi([bottom, top], bars);
    expect(strokes).toHaveLength(1);
    expect(strokes[0]).toMatchObject({
      direction: 'up',
      startIndex: 1,
      endIndex: 5,
      startPrice: 10,
      endPrice: 22,
      high: 22,
      low: 10,
    });
  });

  it('extends the endpoint when a later top is higher', () => {
    const strokes = buildBi([bottom, top, topLater], bars);
    expect(strokes).toHaveLength(1);
    expect(strokes[0]).toMatchObject({ endIndex: 9, endPrice: 30, high: 30 });
  });

  it('keeps the earlier top when the later one is lower', () => {
    const lower = fractal('top', 9, 21, 19);
    const barsWithLower = bars.map((bar) => ({ ...bar }));
    barsWithLower[9] = { ...barsWithLower[9], high: 21, low: 19 };
    const strokes = buildBi([bottom, top, lower], barsWithLower);
    expect(strokes).toHaveLength(1);
    expect(strokes[0].endIndex).toBe(5);
  });

  it('builds a down stroke', () => {
    const falling = [
      merged(0, 20, 16),
      merged(1, 24, 18),
      merged(2, 22, 16),
      merged(3, 19, 14),
      merged(4, 17, 12),
      merged(5, 14, 8),
      merged(6, 16, 10),
    ];
    const high = fractal('top', 1, 24, 18);
    const low = fractal('bottom', 5, 14, 8);
    const strokes = buildBi([high, low], falling);
    expect(strokes).toHaveLength(1);
    expect(strokes[0]).toMatchObject({ direction: 'down', startPrice: 24, endPrice: 8, high: 24, low: 8 });
  });

  it('returns no stroke from a short fractal list', () => {
    expect(buildBi([], bars)).toEqual([]);
    expect(buildBi([bottom], bars)).toEqual([]);
    expect(buildBi([bottom, topNear], bars)).toEqual([]);
  });
});

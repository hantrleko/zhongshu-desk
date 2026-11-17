import { describe, expect, it } from 'vitest';
import { findFractals } from '../src/engine/fractal.ts';
import { mergeInclusion } from '../src/engine/inclusion.ts';
import { merged, raw } from './helpers.ts';

const t = (day: number) => 1_700_000_000 + day * 86_400;

function series(rows: Array<[number, number]>) {
  return mergeInclusion(rows.map(([high, low], index) => raw(t(index), high, low)));
}

describe('fractals', () => {
  it('returns nothing for a short series', () => {
    expect(findFractals(series([[10, 8]]))).toEqual([]);
    expect(findFractals(series([[10, 8], [11, 9]]))).toEqual([]);
    expect(findFractals([])).toEqual([]);
  });

  it('marks a strict top and a strict bottom', () => {
    const fractals = findFractals(
      series([
        [13, 11],
        [12, 10],
        [16, 13],
        [18, 15],
        [19, 16],
        [22, 18],
        [20, 17],
      ]),
    );
    expect(fractals.map((item) => item.type)).toEqual(['bottom', 'top']);
    expect(fractals[0]).toMatchObject({ index: 1, extreme: 10 });
    expect(fractals[1]).toMatchObject({ index: 5, extreme: 22 });
  });

  it('rejects a bar that only wins on the high', () => {
    const fractals = findFractals([merged(0, 10, 5), merged(1, 14, 4), merged(2, 12, 6)]);
    expect(fractals).toEqual([]);
  });

  it('rejects equal highs', () => {
    const fractals = findFractals([merged(0, 10, 5), merged(1, 12, 8), merged(2, 12, 6)]);
    expect(fractals).toEqual([]);
  });
});

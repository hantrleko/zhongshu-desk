import { buildBi } from './bi.ts';
import { findFractals } from './fractal.ts';
import { findHubs } from './hub.ts';
import { mergeInclusion } from './inclusion.ts';
import { findThirdClass } from './marks.ts';
import { buildSegments } from './segment.ts';
import type { Analysis, Bar } from './types.ts';

export class SeriesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeriesError';
  }
}

export function assertSeries(bars: readonly Bar[]): void {
  for (let i = 0; i < bars.length; i += 1) {
    const bar = bars[i];
    if (
      !Number.isFinite(bar.time) ||
      !Number.isFinite(bar.open) ||
      !Number.isFinite(bar.high) ||
      !Number.isFinite(bar.low) ||
      !Number.isFinite(bar.close)
    ) {
      throw new SeriesError(`Bar ${i} has a non-finite value.`);
    }
    if (bar.high < bar.low) throw new SeriesError(`Bar ${i} has high below low.`);
    if (bar.open > bar.high || bar.open < bar.low || bar.close > bar.high || bar.close < bar.low) {
      throw new SeriesError(`Bar ${i} has open or close outside the high-low range.`);
    }
    if (i > 0 && bar.time <= bars[i - 1].time) throw new SeriesError(`Bar ${i} does not move forward in time.`);
  }
}

/** Run the whole desk engine. An empty series is valid and simply has no hub. */
export function analyze(bars: readonly Bar[]): Analysis {
  assertSeries(bars);
  const merged = mergeInclusion(bars);
  const fractals = findFractals(merged);
  const bi = buildBi(fractals, merged);
  const segments = buildSegments(bi);
  const biHubs = findHubs(bi, 'bi');
  const segmentHubs = findHubs(segments, 'segment');
  return {
    merged,
    fractals,
    bi,
    segments,
    biHubs,
    segmentHubs,
    biMarks: findThirdClass(bi, biHubs, 'bi'),
    segmentMarks: findThirdClass(segments, segmentHubs, 'segment'),
  };
}

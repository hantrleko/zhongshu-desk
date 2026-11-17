import type { Bar } from '../engine/types.ts';

/** Midnight UTC, Tuesday 2 January 2024. Fixture clocks start here. */
export const FIXTURE_EPOCH = Date.UTC(2024, 0, 2) / 1000;

const DAY = 86_400;
const WICK = 0.5;

function nextWeekday(time: number): number {
  const next = time + DAY;
  const day = new Date(next * 1000).getUTCDay();
  if (day === 6) return next + 2 * DAY;
  if (day === 0) return next + DAY;
  return next;
}

/**
 * Daily bars whose highs and lows follow `turns`.
 * `gap` merged-friendly steps sit between turns. With gap 3 the fractal centers
 * are 4 bars apart, which is the minimum this desk accepts for a stroke.
 * A lead bar and a tail bar give the first and last turns a neighbor, so they can be fractals.
 * Wick is ±0.5 and turn deltas should be multiples of 4 so the spines stay on integers.
 */
export function synthesize(turns: readonly number[], gap = 3, start = FIXTURE_EPOCH): Bar[] {
  if (turns.length < 2) return [];
  const spines: number[] = [];
  const lead = turns[1] > turns[0] ? turns[0] + 8 : turns[0] - 8;
  spines.push(lead);
  spines.push(turns[0]);
  for (let t = 0; t < turns.length - 1; t += 1) {
    const from = turns[t];
    const to = turns[t + 1];
    const steps = gap + 1;
    for (let step = 1; step <= steps; step += 1) {
      if (step === steps) spines.push(to);
      else spines.push(from + ((to - from) * step) / steps);
    }
  }
  const last = turns[turns.length - 1];
  const before = turns[turns.length - 2];
  spines.push(last > before ? last - 8 : last + 8);

  const insets = [0.125, 0.25, 0.375, 0.25];
  let time = start;
  return spines.map((spine, index) => {
    const barTime = time;
    if (index < spines.length - 1) time = nextWeekday(time);
    const high = spine + WICK;
    const low = spine - WICK;
    const inset = insets[index % insets.length];
    const up = spine >= (index === 0 ? spine : spines[index - 1]);
    const open = up ? low + inset : high - inset;
    const close = up ? high - inset : low + inset;
    return { time: barTime, open, high, low, close };
  });
}

export function barCountForTurns(turnCount: number, gap = 3): number {
  if (turnCount < 2) return 0;
  return 3 + (gap + 1) * (turnCount - 1);
}

import type { Bar, Fractal, MergedBar } from '../src/engine/types.ts';

export function raw(time: number, high: number, low: number, open = low, close = high): Bar {
  return { time, open, high, low, close };
}

export function merged(index: number, high: number, low: number): MergedBar {
  const time = 1_700_000_000 + index * 86_400;
  return {
    time,
    endTime: time,
    open: low,
    high,
    low,
    close: high,
    startIndex: index,
    endIndex: index,
    direction: 'flat',
    rawCount: 1,
  };
}

export function fractal(
  type: Fractal['type'],
  index: number,
  high: number,
  low: number,
): Fractal {
  const time = 1_700_000_000 + index * 86_400;
  return {
    type,
    index,
    time,
    endTime: time,
    high,
    low,
    extreme: type === 'top' ? high : low,
  };
}

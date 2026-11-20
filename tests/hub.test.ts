import { describe, expect, it } from 'vitest';
import { findHubs, type Swing } from '../src/engine/hub.ts';
import { findThirdClass } from '../src/engine/marks.ts';
import type { Direction, Segment } from '../src/engine/types.ts';

function swing(index: number, direction: Direction, low: number, high: number): Swing {
  return {
    id: `bi-${index + 1}`,
    direction,
    low,
    high,
    startTime: 1_700_000_000 + index * 86_400,
    endTime: 1_700_000_000 + (index + 1) * 86_400,
  };
}

function segment(index: number, direction: Direction, low: number, high: number, finished: boolean): Segment {
  return {
    id: `seg-${index + 1}`,
    direction,
    startBi: index * 3,
    endBi: index * 3 + 2,
    startTime: 1_700_000_000 + index * 86_400,
    endTime: 1_700_000_000 + (index + 1) * 86_400,
    startPrice: low,
    endPrice: high,
    low,
    high,
    finished,
    biIds: [],
  };
}

describe('hubs', () => {
  it('finds one hub and keeps ZG and ZD on the first three swings', () => {
    const swings = [
      swing(0, 'up', 100, 130),
      swing(1, 'down', 110, 130),
      swing(2, 'up', 110, 125),
    ];
    const hubs = findHubs(swings, 'bi');
    expect(hubs).toHaveLength(1);
    expect(hubs[0]).toMatchObject({
      zg: 125,
      zd: 110,
      gg: 130,
      dd: 100,
      status: 'active',
      extended: false,
      leaveDirection: 'none',
      enterDirection: 'up',
      startSwing: 0,
      endSwing: 2,
      memberIds: ['bi-1', 'bi-2', 'bi-3'],
    });
  });

  it('extends without moving ZG or ZD, and widens GG', () => {
    const swings = [
      swing(0, 'up', 100, 130),
      swing(1, 'down', 110, 130),
      swing(2, 'up', 110, 125),
      swing(3, 'down', 112, 140),
    ];
    const hubs = findHubs(swings, 'bi');
    expect(hubs).toHaveLength(1);
    expect(hubs[0]).toMatchObject({ zg: 125, zd: 110, gg: 140, dd: 100, extended: true, endSwing: 3, status: 'active' });
  });

  it('marks an upward leave and does not include the leaving swing', () => {
    const swings = [
      swing(0, 'up', 100, 130),
      swing(1, 'down', 110, 130),
      swing(2, 'up', 110, 125),
      swing(3, 'down', 112, 124),
      swing(4, 'up', 130, 150),
    ];
    const hubs = findHubs(swings, 'bi');
    expect(hubs).toHaveLength(1);
    expect(hubs[0]).toMatchObject({ status: 'left-up', leaveDirection: 'up', endSwing: 3 });
    expect(hubs[0].memberIds).not.toContain('bi-5');
  });

  it('places two adjacent hubs that do not share members', () => {
    const swings = [
      swing(0, 'up', 100, 130),
      swing(1, 'down', 110, 130),
      swing(2, 'up', 110, 125),
      swing(3, 'down', 112, 124),
      swing(4, 'up', 130, 150),
      swing(5, 'down', 132, 150),
      swing(6, 'up', 133, 148),
    ];
    const hubs = findHubs(swings, 'bi');
    expect(hubs).toHaveLength(2);
    expect(hubs[0].endSwing).toBe(3);
    expect(hubs[1].startSwing).toBe(4);
    expect(hubs[1].startSwing).toBeGreaterThan(hubs[0].endSwing);
    expect(hubs[1].zd).toBeGreaterThan(hubs[0].zg);
    expect(hubs[1]).toMatchObject({ zg: 148, zd: 133, status: 'active' });
  });

  it('collapses overlapping candidate windows into one extended hub', () => {
    const swings = [
      swing(0, 'up', 100, 120),
      swing(1, 'down', 105, 120),
      swing(2, 'up', 105, 118),
      swing(3, 'down', 108, 119),
      swing(4, 'up', 108, 117),
    ];
    const hubs = findHubs(swings, 'bi');
    expect(hubs).toHaveLength(1);
    expect(hubs[0]).toMatchObject({ startSwing: 0, endSwing: 4, extended: true, zg: 118, zd: 105 });
  });

  it('slides past a window that does not overlap', () => {
    const swings = [
      swing(0, 'up', 50, 60),
      swing(1, 'down', 40, 60),
      swing(2, 'up', 40, 45),
      swing(3, 'down', 42, 55),
      swing(4, 'up', 43, 54),
    ];
    const hubs = findHubs(swings, 'bi');
    expect(hubs).toHaveLength(1);
    expect(hubs[0]).toMatchObject({ startSwing: 1, endSwing: 4, zg: 45, zd: 42 });
  });

  it('does not treat a single-price touch as a hub', () => {
    const swings = [swing(0, 'up', 100, 110), swing(1, 'down', 110, 120), swing(2, 'up', 100, 110)];
    expect(findHubs(swings, 'bi')).toEqual([]);
  });

  it('returns no hub for a short list or a breakdown', () => {
    expect(findHubs([], 'bi')).toEqual([]);
    expect(findHubs([swing(0, 'up', 1, 2)], 'bi')).toEqual([]);
    expect(findHubs([swing(0, 'up', 1, 2), swing(1, 'down', 1, 2)], 'bi')).toEqual([]);
    const breakdown = [swing(0, 'up', 50, 60), swing(1, 'down', 40, 60), swing(2, 'up', 40, 45)];
    expect(findHubs(breakdown, 'bi')).toEqual([]);
  });

  it('labels a third-class buy only when the pullback stays above ZG', () => {
    const held = [
      swing(0, 'up', 100, 130),
      swing(1, 'down', 110, 130),
      swing(2, 'up', 110, 125),
      swing(3, 'up', 130, 150),
      swing(4, 'down', 132, 150),
    ];
    const hubs = findHubs(held, 'bi');
    const marks = findThirdClass(held, hubs, 'bi');
    expect(marks).toEqual([
      { kind: 'buy3', time: held[4].endTime, price: 132, hubId: 'bi-hub-1', level: 'bi', pending: true },
    ]);

    const reentered = [
      swing(0, 'up', 100, 130),
      swing(1, 'down', 110, 130),
      swing(2, 'up', 110, 125),
      swing(3, 'up', 130, 150),
      swing(4, 'down', 120, 150),
    ];
    const reenteredHubs = findHubs(reentered, 'bi');
    expect(findThirdClass(reentered, reenteredHubs, 'bi')).toEqual([]);
  });

  it('labels a third-class sell when the bounce stays below ZD', () => {
    const swings = [
      swing(0, 'down', 100, 130),
      swing(1, 'up', 100, 120),
      swing(2, 'down', 105, 120),
      swing(3, 'down', 80, 100),
      swing(4, 'up', 80, 99),
    ];
    const hubs = findHubs(swings, 'bi');
    expect(hubs[0]).toMatchObject({ status: 'left-down', zd: 105, zg: 120 });
    expect(findThirdClass(swings, hubs, 'bi')).toMatchObject([{ kind: 'sell3', price: 99 }]);
  });

  it('flags a third-class mark pending only while its carrier swing is the unconfirmed tail', () => {
    const tail = [
      swing(0, 'up', 100, 130),
      swing(1, 'down', 110, 130),
      swing(2, 'up', 110, 125),
      swing(3, 'up', 130, 150),
      swing(4, 'down', 132, 150),
    ];
    const tailHubs = findHubs(tail, 'bi');
    expect(findThirdClass(tail, tailHubs, 'bi')[0]?.pending).toBe(true);

    const confirmed = [...tail, swing(5, 'up', 140, 160)];
    const confirmedHubs = findHubs(confirmed, 'bi');
    const mark = findThirdClass(confirmed, confirmedHubs, 'bi').find((item) => item.kind === 'buy3');
    expect(mark).toMatchObject({ price: 132, pending: false });
  });

  it('treats a finished tail segment as confirmed but an unfinished one as pending', () => {
    const finishedSwings = [
      segment(0, 'up', 100, 130, true),
      segment(1, 'down', 110, 130, true),
      segment(2, 'up', 110, 125, true),
      segment(3, 'up', 130, 150, true),
      segment(4, 'down', 132, 150, true),
    ];
    const finishedHubs = findHubs(finishedSwings, 'segment');
    expect(findThirdClass(finishedSwings, finishedHubs, 'segment')[0]?.pending).toBe(false);

    const unfinishedSwings = finishedSwings.map((item, index) =>
      index === finishedSwings.length - 1 ? { ...item, finished: false } : item,
    );
    const unfinishedHubs = findHubs(unfinishedSwings, 'segment');
    expect(findThirdClass(unfinishedSwings, unfinishedHubs, 'segment')[0]?.pending).toBe(true);
  });
});

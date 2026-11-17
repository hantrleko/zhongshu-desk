import type { Direction, Hub, HubLevel, HubStatus } from './types.ts';

export interface Swing {
  id: string;
  direction: Direction;
  high: number;
  low: number;
  startTime: number;
  endTime: number;
}

function overlaps(swing: Swing, zd: number, zg: number): boolean {
  return swing.low <= zg && swing.high >= zd;
}

/**
 * Hubs from a swing list. A hub exists when three consecutive ranges have ZG > ZD.
 * ZG and ZD stay fixed. Later swings that still intersect [ZD, ZG] extend the hub
 * and update GG/DD only. The first swing that lies entirely outside ends the hub
 * and is the first candidate of the next search, so same-level hubs do not share members.
 * Touching at a single price (ZG === ZD) is not a hub.
 */
export function findHubs(swings: readonly Swing[], level: HubLevel): Hub[] {
  const hubs: Hub[] = [];
  let index = 0;
  while (index + 2 < swings.length) {
    const first = swings[index];
    const second = swings[index + 1];
    const third = swings[index + 2];
    const zg = Math.min(first.high, second.high, third.high);
    const zd = Math.max(first.low, second.low, third.low);
    if (!(zg > zd)) {
      index += 1;
      continue;
    }
    let end = index + 2;
    let gg = Math.max(first.high, second.high, third.high);
    let dd = Math.min(first.low, second.low, third.low);
    let cursor = index + 3;
    for (; cursor < swings.length; cursor += 1) {
      const swing = swings[cursor];
      if (!overlaps(swing, zd, zg)) break;
      end = cursor;
      gg = Math.max(gg, swing.high);
      dd = Math.min(dd, swing.low);
    }
    const leaving = cursor < swings.length ? swings[cursor] : undefined;
    let status: HubStatus = 'active';
    let leaveDirection: Direction | 'none' = 'none';
    if (leaving && leaving.low > zg) {
      status = 'left-up';
      leaveDirection = 'up';
    } else if (leaving && leaving.high < zd) {
      status = 'left-down';
      leaveDirection = 'down';
    }
    const members = swings.slice(index, end + 1);
    hubs.push({
      id: `${level}-hub-${hubs.length + 1}`,
      level,
      startTime: first.startTime,
      endTime: swings[end].endTime,
      startSwing: index,
      endSwing: end,
      zg,
      zd,
      gg,
      dd,
      memberIds: members.map((swing) => swing.id),
      status,
      extended: members.length > 3,
      enterDirection: first.direction,
      leaveDirection,
    });
    if (!leaving) break;
    index = cursor;
  }
  return hubs;
}

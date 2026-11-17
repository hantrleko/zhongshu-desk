import type { Hub, HubLevel, Mark } from './types.ts';
import type { Swing } from './hub.ts';

/**
 * Third-class structural labels only.
 * After an upward leave, the first downward swing that stays entirely above ZG
 * is marked at its low. The downward case is symmetric.
 * There is no MACD divergence here, so first and second class points are not labeled.
 */
export function findThirdClass(swings: readonly Swing[], hubs: readonly Hub[], level: HubLevel): Mark[] {
  const marks: Mark[] = [];
  for (const hub of hubs) {
    if (hub.level !== level || hub.leaveDirection === 'none') continue;
    const leaveIndex = hub.endSwing + 1;
    if (leaveIndex >= swings.length) continue;
    if (hub.leaveDirection === 'up') {
      let index = leaveIndex;
      if (swings[index].direction !== 'down') index += 1;
      const pullback = swings[index];
      if (pullback && pullback.direction === 'down' && pullback.low > hub.zg) {
        marks.push({ kind: 'buy3', time: pullback.endTime, price: pullback.low, hubId: hub.id, level });
      }
    } else {
      let index = leaveIndex;
      if (swings[index].direction !== 'up') index += 1;
      const bounce = swings[index];
      if (bounce && bounce.direction === 'up' && bounce.high < hub.zd) {
        marks.push({ kind: 'sell3', time: bounce.endTime, price: bounce.high, hubId: hub.id, level });
      }
    }
  }
  return marks;
}

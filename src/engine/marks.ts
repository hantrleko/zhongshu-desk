import type { Hub, HubLevel, Mark, Segment } from './types.ts';
import type { Swing } from './hub.ts';

/**
 * Third-class structural labels only.
 * After an upward leave, the first downward swing that stays entirely above ZG
 * is marked at its low. The downward case is symmetric.
 * There is no MACD divergence here, so first and second class points are not labeled.
 *
 * A label riding on the last swing is provisional: that swing can still extend
 * or be revised, so the mark is flagged `pending` and drawn dashed.
 */
export function findThirdClass(swings: readonly Swing[], hubs: readonly Hub[], level: HubLevel): Mark[] {
  const marks: Mark[] = [];
  for (const hub of hubs) {
    if (hub.level !== level || hub.leaveDirection === 'none') continue;
    const leaveIndex = hub.endSwing + 1;
    if (leaveIndex >= swings.length) continue;
    const push = (kind: Mark['kind'], swing: Swing, index: number): void => {
      const last = index === swings.length - 1;
      const unfinished = level === 'segment' ? (swing as Segment).finished === false : true;
      marks.push({
        kind,
        time: swing.endTime,
        price: kind === 'buy3' ? swing.low : swing.high,
        hubId: hub.id,
        level,
        pending: last && unfinished,
      });
    };
    if (hub.leaveDirection === 'up') {
      let index = leaveIndex;
      if (swings[index].direction !== 'down') index += 1;
      const pullback = swings[index];
      if (pullback && pullback.direction === 'down' && pullback.low > hub.zg) push('buy3', pullback, index);
    } else {
      let index = leaveIndex;
      if (swings[index].direction !== 'up') index += 1;
      const bounce = swings[index];
      if (bounce && bounce.direction === 'up' && bounce.high < hub.zd) push('sell3', bounce, index);
    }
  }
  return marks;
}

/** Where the last close sits relative to a hub band. Touching ZG or ZD counts as inside. */
export function priceBand(close: number, zd: number, zg: number): 'above' | 'inside' | 'below' {
  if (close > zg) return 'above';
  if (close < zd) return 'below';
  return 'inside';
}

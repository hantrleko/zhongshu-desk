import { describe, expect, it } from 'vitest';
import { priceBand } from '../src/engine/readout.ts';

describe('price band', () => {
  it('places the close above, inside, and below a hub', () => {
    expect(priceBand(130, 100, 120)).toBe('above');
    expect(priceBand(110, 100, 120)).toBe('inside');
    expect(priceBand(90, 100, 120)).toBe('below');
  });

  it('treats a touch of ZG or ZD as inside', () => {
    expect(priceBand(120, 100, 120)).toBe('inside');
    expect(priceBand(100, 100, 120)).toBe('inside');
  });
});

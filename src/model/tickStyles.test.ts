import { describe, expect, it } from 'vitest';
import { TICK_STYLES, tickSegments } from './tickStyles';

const length = (segs: [number, number][]) => segs.reduce((s, [a, b]) => s + (b - a), 0);

describe('tick styles', () => {
  for (const { id } of TICK_STYLES) {
    it(`${id}: long lines are longer than short ones and stay on the face`, () => {
      const long = tickSegments(id, true, 0);
      const shorts = [1, 2, 3].map((k) => tickSegments(id, false, k));
      for (const segs of [long, ...shorts]) {
        for (const [a, b] of segs) {
          expect(a).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(1);
          expect(b).toBeGreaterThan(a);
        }
      }
      for (const s of shorts) expect(length(s)).toBeLessThan(length(long));
    });
  }

  it('left and right justify to opposite edges', () => {
    expect(tickSegments('left', false, 1)[0][0]).toBe(tickSegments('left', true, 0)[0][0]);
    expect(tickSegments('right', false, 1)[0][1]).toBe(tickSegments('right', true, 0)[0][1]);
  });

  it('alternating swaps sides between neighbouring short lines', () => {
    expect(tickSegments('alternating', false, 1)).not.toEqual(tickSegments('alternating', false, 2));
    expect(tickSegments('alternating', false, 1)).toEqual(tickSegments('alternating', false, 3));
  });
});

import { describe, expect, it } from 'vitest';
import { labelStep, stripTicks, tickStep } from './strip';

describe('strip ticks', () => {
  it('picks the finest step that stays at least 1 mm apart', () => {
    expect(tickStep(120, 100)).toBe(1); // 1.2 mm
    expect(tickStep(100, 100)).toBe(1); // 1.0 mm
    expect(tickStep(52, 100)).toBe(2); //  1.04 mm
    expect(tickStep(30, 100)).toBe(5); //  1.5 mm
    expect(tickStep(15, 100)).toBe(10);
  });

  it('labels every 10 when there is room', () => {
    expect(labelStep(52, 100)).toBe(10);
    expect(labelStep(30, 100)).toBe(20);
  });

  it('builds a 0–100 strip for the default 52 mm zone', () => {
    const ticks = stripTicks(52, 100);
    expect(ticks.filter((t) => t.size === 'label').map((t) => t.units)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(ticks.filter((t) => t.size === 'half').map((t) => t.units)).toEqual([5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);
    // every even unit plus the odd fives
    expect(ticks).toHaveLength(51 + 10);
  });
});

import { describe, expect, it } from 'vitest';
import { crawlAt, farDistanceFor, fitCrawl, twinDistance, type CrawlFit } from './fit';

const truth = { a: 60, b: 200, c: 1.2 };
const exact = (d: number) => truth.a - truth.b / d - truth.c * d;

function mustFit(readings: { distance: number; crawl: number }[]): CrawlFit {
  const r = fitCrawl(readings);
  if (!r.ok) throw new Error(r.reason);
  return r.fit;
}

describe('fitCrawl', () => {
  it('recovers the parameters of noiseless data', () => {
    const fit = mustFit([5, 10, 18, 25, 30, 40].map((d) => ({ distance: d, crawl: exact(d) })));
    expect(fit.a).toBeCloseTo(truth.a, 6);
    expect(fit.b).toBeCloseTo(truth.b, 6);
    expect(fit.c).toBeCloseTo(truth.c, 6);
    expect(fit.rms).toBeCloseTo(0, 6);
    expect(fit.fold).toBeCloseTo(Math.sqrt(200 / 1.2), 6);
    expect(crawlAt(fit, fit.pointOn!)).toBeCloseTo(0, 6);
  });

  it('fits the prototype sample readings sensibly', () => {
    const data = [[5, 26.5], [10, 41.5], [18, 39.5], [25, 32.5], [30, 26.5], [40, 13.5], [50, 0]];
    const fit = mustFit(data.map(([distance, crawl]) => ({ distance, crawl })));
    expect(fit.fold).toBeGreaterThan(10);
    expect(fit.fold).toBeLessThan(15);
    expect(fit.pointOn).toBeGreaterThan(45);
    expect(fit.pointOn).toBeLessThan(55);
    expect(fit.rms).toBeLessThan(2);
  });

  it('needs three distinct distances', () => {
    expect(fitCrawl([{ distance: 10, crawl: 30 }, { distance: 10, crawl: 31 }, { distance: 20, crawl: 25 }]).ok).toBe(false);
  });

  it('rejects crawl that grows with distance', () => {
    const r = fitCrawl([10, 20, 30, 40].map((d) => ({ distance: d, crawl: d })));
    expect(r.ok).toBe(false);
  });

  it('reports no fold when there is no near turn-back', () => {
    const fit = mustFit([20, 30, 40, 50].map((d) => ({ distance: d, crawl: 50 - d + 5 / d })));
    expect(fit.fold).toBeNull();
  });
});

describe('twins and inverses', () => {
  const fit = mustFit([5, 10, 18, 25, 30, 40].map((d) => ({ distance: d, crawl: exact(d) })));

  it('a near distance and its twin share a crawl', () => {
    for (const d of [3, 5, 8, 10]) expect(crawlAt(fit, twinDistance(fit, d))).toBeCloseTo(crawlAt(fit, d), 9);
  });

  it('farDistanceFor inverts crawlAt on the far branch', () => {
    for (const d of [15, 22.5, 35, 45]) expect(farDistanceFor(fit, crawlAt(fit, d))).toBeCloseTo(d, 9);
  });
});

export interface Reading {
  /** metres */
  distance: number;
  /** mm down the strip from the top of the marking zone */
  crawl: number;
}

/**
 * crawl(d) = a − b/d − c·d
 *
 * The arrow sits below the eye, so its path crosses the line of sight twice.
 * Crawl therefore rises to a peak (the fold) and shrinks again up close, and
 * every near distance d shares its crawl with the far distance b / (c·d).
 */
export interface CrawlFit {
  a: number;
  b: number;
  c: number;
  /** root-mean-square error of the fit against the readings, mm */
  rms: number;
  /** distance of peak crawl, or null when the readings show no turn-back */
  fold: number | null;
  /** far distance where crawl reaches 0, or null if it never does */
  pointOn: number | null;
}

export type FitResult = { ok: true; fit: CrawlFit } | { ok: false; reason: string };

export function crawlAt(fit: CrawlFit, d: number): number {
  return fit.a - fit.b / d - fit.c * d;
}

/** The distance on the other side of the fold that uses the same crawl as d. */
export function twinDistance(fit: CrawlFit, d: number): number {
  return fit.b / (fit.c * d);
}

/** The far-branch distance that uses the given crawl, or null if none does. */
export function farDistanceFor(fit: CrawlFit, crawl: number): number | null {
  // c·d² − (a − crawl)·d + b = 0, larger root
  const k = fit.a - crawl;
  const disc = k * k - 4 * fit.b * fit.c;
  if (disc < 0) return null;
  return (k + Math.sqrt(disc)) / (2 * fit.c);
}

export function fitCrawl(readings: Reading[]): FitResult {
  if (new Set(readings.map((r) => r.distance)).size < 3) {
    return { ok: false, reason: 'Enter readings at three or more distances.' };
  }

  // least squares on the basis [1, −1/d, −d] via the normal equations
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const r = [0, 0, 0];
  for (const { distance: d, crawl: y } of readings) {
    const basis = [1, -1 / d, -d];
    for (let i = 0; i < 3; i++) {
      r[i] += basis[i] * y;
      for (let j = 0; j < 3; j++) A[i][j] += basis[i] * basis[j];
    }
  }
  const p = solve3(A, r);
  if (!p) return { ok: false, reason: 'These readings could not be fitted. Check for typos.' };

  const [a, b, c] = p;
  if (!(c > 0)) {
    return { ok: false, reason: 'Your crawl should get smaller as the distance grows. Check your far readings.' };
  }

  const disc = a * a - 4 * b * c;
  const partial: CrawlFit = {
    a, b, c,
    rms: 0,
    fold: b > 0 ? Math.sqrt(b / c) : null,
    pointOn: disc >= 0 ? (a + Math.sqrt(disc)) / (2 * c) : null,
  };
  const sq = readings.reduce((s, { distance, crawl }) => s + (crawlAt(partial, distance) - crawl) ** 2, 0);
  return { ok: true, fit: { ...partial, rms: Math.sqrt(sq / readings.length) } };
}

function solve3(A: number[][], r: number[]): number[] | null {
  const M = A.map((row, i) => [...row, r[i]]);
  const scale = Math.max(...A.flat().map(Math.abs));
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let i = col + 1; i < 3; i++) if (Math.abs(M[i][col]) > Math.abs(M[piv][col])) piv = i;
    if (Math.abs(M[piv][col]) < 1e-12 * scale) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let i = col + 1; i < 3; i++) {
      const k = M[i][col] / M[col][col];
      for (let j = col; j < 4; j++) M[i][j] -= k * M[col][j];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let v = M[i][3];
    for (let j = i + 1; j < 3; j++) v -= M[i][j] * x[j];
    x[i] = v / M[i][i];
  }
  return x.every(Number.isFinite) ? x : null;
}

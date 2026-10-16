import { NextLink, Screen, Tip } from '../components/Screen';
import { CrawlFit, FitResult, Reading, crawlAt, twinDistance } from '../model/fit';
import { AppState, fmtMetres } from '../state';

const ACCENT = '#E0A100';

function CrawlChart({ fit, readings }: { fit: CrawlFit; readings: Reading[] }) {
  const L = 30, R = 314, T = 14, B = 190;
  const xMax = Math.ceil((Math.max(...readings.map((r) => r.distance), fit.pointOn ?? 0) + 2) / 10) * 10;
  const peak = fit.fold !== null ? crawlAt(fit, fit.fold) : 0;
  const yMax = Math.ceil((Math.max(peak, ...readings.map((r) => r.crawl)) + 2) / 10) * 10;
  const X = (d: number) => L + (d / xMax) * (R - L);
  const Y = (c: number) => B - (Math.max(c, -yMax * 0.04) / yMax) * (B - T);
  const path = (from: number, to: number) => {
    let s = '';
    for (let i = 0; i <= 120; i++) {
      const d = from + ((to - from) * i) / 120;
      s += `${i ? ' L' : 'M'}${X(d).toFixed(1)} ${Y(crawlAt(fit, d)).toFixed(1)}`;
    }
    return s;
  };
  const start = Math.max(1.5, Math.min(...readings.map((r) => r.distance)) * 0.6);
  const end = Math.min(xMax, (fit.pointOn ?? xMax) + 2);
  const yTicks = Array.from({ length: yMax / 10 + 1 }, (_, i) => i * 10);
  const xTicks = Array.from({ length: xMax / 10 }, (_, i) => (i + 1) * 10);
  const isNear = (d: number) => fit.fold !== null && d < fit.fold;

  return (
    <svg viewBox="0 0 320 220" className="chart" role="img"
      aria-label={`Crawl against distance${fit.fold !== null ? `, peaking near ${fit.fold.toFixed(0)} m` : ''}.`}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? '#8A948E' : '#EEF1EE'} />
          <text x={L - 6} y={Y(v)} className="chart-label" textAnchor="end" dominantBaseline="central">{v}</text>
        </g>
      ))}
      {xTicks.map((v) => <text key={v} x={X(v)} y={B + 14} className="chart-label" textAnchor="middle">{v}</text>)}
      {fit.fold !== null ? (
        <>
          <line x1={X(fit.fold)} x2={X(fit.fold)} y1={T} y2={B} stroke="#4A5650" strokeDasharray="3 4" />
          <text x={X(fit.fold) + 5} y={T + 4} className="chart-label caps">Fold</text>
          <path d={path(fit.fold, end)} fill="none" stroke="#0F5C5A" strokeWidth="2.5" />
          <path d={path(start, fit.fold)} fill="none" stroke="#C2410C" strokeWidth="2.5" strokeDasharray="6 4" />
        </>
      ) : (
        <path d={path(start, end)} fill="none" stroke="#0F5C5A" strokeWidth="2.5" />
      )}
      {readings.map((r) => isNear(r.distance) ? (
        <rect key={r.distance} x={X(r.distance) - 5} y={Y(r.crawl) - 5} width="10" height="10" rx="2" fill="#F2A27A" stroke="#17201B" strokeWidth="2" />
      ) : (
        <circle key={r.distance} cx={X(r.distance)} cy={Y(r.crawl)} r="5" fill={ACCENT} stroke="#17201B" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function Fit({ state, result, readings }: { state: AppState; result: FitResult; readings: Reading[] }) {
  if (!result.ok) {
    return (
      <Screen step={3} title="Your crawl curve" intro="We couldn't fit a curve yet."
        footer={<a className="cta" href="#/readings">Back to readings</a>}>
        <Tip tone="warn">{result.reason}</Tip>
      </Screen>
    );
  }

  const { fit } = result;
  const fold = fit.fold;
  const pairs = fold !== null ? state.distances.filter((d) => d < fold) : [];

  return (
    <Screen
      step={3}
      title="Your crawl curve"
      intro={fold !== null
        ? 'Your crawl peaks at the fold, then shrinks again up close.'
        : 'Your readings don’t show the turn-back yet, so near distances can’t be placed.'}
      footer={<NextLink to="sheet">Build marker sheet</NextLink>}
    >
      <div className="stats">
        <div className="stat"><div className="stat-label">Fit error</div><div className="stat-value">{fit.rms.toFixed(1)}<span> mm</span></div></div>
        <div className="stat"><div className="stat-label">Fold</div><div className="stat-value">{fold !== null ? fold.toFixed(0) : '—'}<span> m</span></div></div>
        <div className="stat"><div className="stat-label">Point-on</div><div className="stat-value">{fit.pointOn !== null ? fit.pointOn.toFixed(0) : '—'}<span> m</span></div></div>
      </div>

      <figure className="card chart-card">
        <CrawlChart fit={fit} readings={readings} />
        <figcaption>
          {fold !== null && (
            <span><svg width="20" height="6" aria-hidden="true"><line x1="0" y1="3" x2="20" y2="3" stroke="#C2410C" strokeWidth="2.5" strokeDasharray="6 4" /></svg>Near branch</span>
          )}
          <span><svg width="20" height="6" aria-hidden="true"><line x1="0" y1="3" x2="20" y2="3" stroke="#0F5C5A" strokeWidth="2.5" /></svg>Far branch</span>
          <span>Crawl mm ↑ · distance m →</span>
        </figcaption>
      </figure>

      {fit.rms > 1.5 && <Tip tone="warn">The curve misses some readings by more than a millimetre or two. Check them for typos, or reshoot the odd one out.</Tip>}
      {fold === null && <Tip tone="warn">Add readings at two or more distances under 15 m.</Tip>}

      {pairs.length > 0 && (
        <div className="pairs">
          <h2 className="group-title">Same crawl, two distances</h2>
          <div className="pair-list">
            {pairs.map((d) => (
              <div key={d} className="pair">
                <span className="near">{d} m</span><span className="muted">=</span>
                <span className="far">{fmtMetres(Math.round(twinDistance(fit, d) * 2) / 2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Screen>
  );
}

// Everything here is drawn in millimetres. On screen the SVGs scale to their
// container; with `trueSize` they carry real mm dimensions so they print 1:1.
import type { TabSpec } from '../state';
import { zoneLength, fmtMetres } from '../state';
import type { Mark, NearLabel } from '../model/marks';

function size(w: number, h: number, trueSize?: boolean) {
  return trueSize ? { width: `${w}mm`, height: `${h}mm` } : { className: 'scaled' };
}

/** Tab face outline: gentle corners at the top, rounder at the bottom. */
function facePath(w: number, h: number) {
  const r1 = Math.min(w, h) * 0.1;
  const r2 = Math.min(w * 0.4, h * 0.3);
  return `M ${r1},0 H ${w - r1} A ${r1} ${r1} 0 0 1 ${w},${r1} V ${h - r2} A ${r2} ${r2} 0 0 1 ${w - r2},${h} `
    + `H ${r2} A ${r2} ${r2} 0 0 1 0,${h - r2} V ${r1} A ${r1} ${r1} 0 0 1 ${r1},0 Z`;
}

const CUT = { fill: 'none', stroke: '#4A5650', strokeWidth: 0.3, strokeDasharray: '1.5 1' };

export function StripDrawing({ tab, trueSize }: { tab: TabSpec; trueSize?: boolean }) {
  const { faceWidth: w, faceLength: h, zoneStart } = tab;
  const len = Math.floor(zoneLength(tab));
  // ticks run down the edge under the index finger; mirror for a left-handed tab
  const left = tab.hand === 'right';
  const x0 = left ? 0 : w;
  const dir = left ? 1 : -1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} {...size(w, h, trueSize)} role="img" aria-label={`Sight-in strip, ${len} mm scale`}>
      <path d={facePath(w, h)} {...CUT} />
      {Array.from({ length: len + 1 }, (_, mm) => {
        const y = zoneStart + mm;
        const long = mm % 5 === 0;
        return <line key={mm} x1={x0} x2={x0 + dir * (long ? 7 : 3.5)} y1={y} y2={y} stroke="#17201B" strokeWidth={long ? 0.3 : 0.2} />;
      })}
      {Array.from({ length: Math.floor(len / 5) + 1 }, (_, i) => (
        <text key={i} x={x0 + dir * 8.5} y={zoneStart + i * 5} className="svg-mono" fontSize={2.6} dominantBaseline="central" textAnchor={left ? 'start' : 'end'}>
          {i * 5}
        </text>
      ))}
      <text x={left ? w - 2.5 : 2.5} y={zoneStart} className="svg-sans" fontSize={2} fill="#4A5650" writingMode="vertical-rl">TOP · NOCK SIDE</text>
    </svg>
  );
}

export function ScaleBar({ trueSize }: { trueSize?: boolean }) {
  return (
    <svg viewBox="0 0 50 2" {...size(50, 2, trueSize)} role="img" aria-label="50 millimetre scale bar" preserveAspectRatio="none">
      <rect x="0" y="0" width="50" height="2" fill="#17201B" />
    </svg>
  );
}

/** What gets copied onto the tab: plain lines only, two lengths. */
export function TabTemplate({ tab, marks, trueSize }: { tab: TabSpec; marks: Mark[]; trueSize?: boolean }) {
  const { faceWidth: w, faceLength: h } = tab;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} {...size(w, h, trueSize)} role="img" aria-label={`Tab template with ${marks.length} lines`}>
      <path d={facePath(w, h)} {...CUT} />
      {marks.map((m) => {
        const inset = w * (m.long ? 0.14 : 0.34);
        const y = tab.zoneStart + m.crawl;
        return <line key={m.id} x1={inset} x2={w - inset} y1={y} y2={y} stroke="#17201B" strokeWidth={0.35} />;
      })}
    </svg>
  );
}

const KEY_SCALE = 2;
const NEAR_COL = 30;
const FAR_COL = 38;
const GAP = 4;
const LABEL_SPACING = 3.6;

/** The numbered key card at 2×: near distances on the left, far ones on the right. */
export function KeyCard({ tab, marks, near, foldCrawl, foldDistance, trueSize }: {
  tab: TabSpec;
  marks: Mark[];
  near: NearLabel[];
  foldCrawl: number | null;
  foldDistance: number | null;
  trueSize?: boolean;
}) {
  const w = tab.faceWidth * KEY_SCALE;
  const h = tab.faceLength * KEY_SCALE;
  const tabX = NEAR_COL + GAP;
  const farX = tabX + w + GAP;
  const width = farX + FAR_COL;
  const y = (crawl: number) => (tab.zoneStart + crawl) * KEY_SCALE;

  // label every long line; short lines only where there is room
  const farPlaced: number[] = [];
  const farLabels: { m: Mark; y: number }[] = [];
  for (const m of [...marks.filter((x) => x.long), ...marks.filter((x) => !x.long)]) {
    const yy = y(m.crawl);
    if (m.long || farPlaced.every((q) => Math.abs(q - yy) >= LABEL_SPACING)) {
      farPlaced.push(yy);
      farLabels.push({ m, y: yy });
    }
  }

  const nearPlaced: number[] = foldCrawl !== null ? [y(foldCrawl)] : [];
  const nearShown = near.filter((n) => {
    const yy = y(n.crawl);
    if (!nearPlaced.every((q) => Math.abs(q - yy) >= LABEL_SPACING)) return false;
    nearPlaced.push(yy);
    return true;
  });

  return (
    <svg viewBox={`0 0 ${width} ${h}`} {...size(width, h, trueSize)} role="img" aria-label="Key card: each tab line with its distance">
      <g transform={`translate(${tabX} 0)`}>
        <path d={facePath(w, h)} fill="none" stroke="#8A948E" strokeWidth={0.4} strokeDasharray="2 1.5" />
      </g>
      {foldCrawl !== null && (
        <>
          <line x1={tabX + 2} x2={tabX + w - 2} y1={y(foldCrawl)} y2={y(foldCrawl)} stroke="#9A3412" strokeWidth={0.4} strokeDasharray="1.5 1" />
          <text x={NEAR_COL} y={y(foldCrawl)} className="svg-sans" fontSize={2.2} fontWeight={600} fill="#9A3412" textAnchor="end" dominantBaseline="central">
            FOLD {foldDistance?.toFixed(0)} m
          </text>
        </>
      )}
      {marks.map((m) => {
        const inset = w * (m.long ? 0.1 : 0.32);
        return <line key={m.id} x1={tabX + inset} x2={tabX + w - inset} y1={y(m.crawl)} y2={y(m.crawl)} stroke="#17201B" strokeWidth={m.long ? 0.6 : 0.4} />;
      })}
      {farLabels.map(({ m, y: yy }) => m.long ? (
        <g key={m.id}>
          <rect x={farX} y={yy - 2} width={9} height={4} rx={1.2} fill="#17201B" />
          <text x={farX + 4.5} y={yy} className="svg-mono" fontSize={2.6} fontWeight={600} fill="#FFFFFF" textAnchor="middle" dominantBaseline="central">{m.id}</text>
          <text x={farX + 11} y={yy} className="svg-mono" fontSize={3} fontWeight={600} fill="#0A3F3E" dominantBaseline="central">{fmtMetres(m.distance)}</text>
        </g>
      ) : (
        <text key={m.id} x={farX + 2} y={yy} className="svg-mono" fontSize={2.2} fill="#4A5650" dominantBaseline="central">
          ·{m.id.split('·')[1]}  {fmtMetres(m.distance)}
        </text>
      ))}
      {nearShown.map((n) => (
        <g key={n.distance}>
          <text x={NEAR_COL - 3} y={y(n.crawl)} className="svg-mono" dominantBaseline="central" textAnchor="end">
            <tspan fontSize={3} fontWeight={600} fill="#9A3412">{fmtMetres(n.distance)}</tspan>
            <tspan fontSize={2.2} fill="#4A5650" dx={1}>{n.exact ? '' : '≈'}{n.ref}</tspan>
          </text>
          <path d={`M ${NEAR_COL - 2} ${y(n.crawl) - 1} l 2 1 l -2 1 z`} fill="#9A3412" />
        </g>
      ))}
    </svg>
  );
}

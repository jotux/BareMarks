import type { Dispatch, SetStateAction } from 'react';
import { PrintButton, Screen, Tip } from '../components/Screen';
import { KeyCard, TabTemplate } from '../components/drawings';
import { FitResult, Reading, crawlAt } from '../model/fit';
import { buildMarks, nearLabels } from '../model/marks';
import { AppState, MINOR_RANGE, SCALE_MAX } from '../state';

const RULES = [
  'Two line lengths only, same thickness and colour',
  'No numbers or writing on the tab face',
  'Key card kept separate from the tab',
];

export function Sheet({ state, setState, result, readings }: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  result: FitResult;
  readings: Reading[];
}) {
  if (!result.ok) {
    return (
      <Screen step={4} title="Marker sheet" intro="Fit a curve first."
        footer={<a className="cta" href="#/readings">Back to readings</a>}>
        <Tip tone="warn">{result.reason}</Tip>
      </Screen>
    );
  }

  const { fit } = result;
  const { tab, minorMarks: minor } = state;
  const marks = buildMarks(fit, {
    minor,
    scaleMax: SCALE_MAX,
    nearestReading: Math.min(...readings.map((r) => r.distance)),
    farthestReading: Math.max(...readings.map((r) => r.distance)),
  });
  const near = nearLabels(fit, marks, state.distances, SCALE_MAX);
  const foldCrawl = fit.fold !== null && crawlAt(fit, fit.fold) <= SCALE_MAX ? crawlAt(fit, fit.fold) : null;
  const setMinor = (n: number) =>
    setState((s) => ({ ...s, minorMarks: Math.min(MINOR_RANGE.max, Math.max(MINOR_RANGE.min, n)) }));
  const step = 5 / (minor + 1);
  const keyCard = (trueSize?: boolean) => (
    <KeyCard tab={tab} marks={marks} near={near} foldCrawl={foldCrawl} foldDistance={fit.fold} trueSize={trueSize} />
  );

  return (
    <>
      <Screen
        step={4}
        title="Marker sheet"
        intro="Plain lines go on the tab. The key card is the same layout, numbered, and stays in your quiver."
        footer={<PrintButton label="Print or save as PDF" />}
      >
        <div className="card stepper">
          <div>
            <div className="stepper-label">Small marks between</div>
            <div className="muted mono small">≈ {step.toFixed(minor >= 4 ? 2 : 1)} m per mark</div>
          </div>
          <div className="stepper-controls">
            <button aria-label="Fewer small marks" disabled={minor <= MINOR_RANGE.min} onClick={() => setMinor(minor - 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14" /></svg>
            </button>
            <output aria-live="polite">{minor}</output>
            <button aria-label="More small marks" disabled={minor >= MINOR_RANGE.max} onClick={() => setMinor(minor + 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>

        {marks.length === 0 ? (
          <Tip tone="warn">None of the 5 m lines fall inside your marking zone. Check the zone on the first screen.</Tip>
        ) : (
          <>
            <section className="card template-card">
              <div className="template-preview"><TabTemplate tab={tab} marks={marks} /></div>
              <div className="template-info">
                <h2 className="label-caps">Tab face · 1:1</h2>
                <div className="legend">
                  <span><span className="legend-long" />Long line, every 5 m</span>
                  <span><span className="legend-short" />Short line, {minor} per gap</span>
                </div>
                <p className="muted">Cut out, hold against the tab and transfer each line with a fine pen. Nothing else goes on the tab.</p>
              </div>
            </section>

            <section className="card keycard" aria-label="Key card">
              <div className="keycard-head">
                <h2 className="label-caps">Key card</h2>
                <span className="muted mono tiny">2× scale · L2·3 = 3rd short above L2</span>
              </div>
              {keyCard()}
            </section>
          </>
        )}

        <div className="rules">
          <div className="rules-head">
            <h2 className="label-caps">World Archery barebow rules</h2>
          </div>
          {RULES.map((c) => (
            <div key={c} className="rule">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </Screen>

      <section className="print-only print-page">
        <h1>Baremarks marker sheet</h1>
        <div className="print-row">
          <div>
            <h2>Tab template · 1:1</h2>
            <TabTemplate tab={tab} marks={marks} trueSize />
          </div>
          <div className="print-notes">
            <p>Cut out the template, hold it against the tab and transfer each line with a fine pen. Nothing else goes on the tab.</p>
            <p>Keep the key card in your quiver, not on the tab.</p>
          </div>
        </div>
        <h2>Key card · 2×</h2>
        {keyCard(true)}
      </section>
    </>
  );
}

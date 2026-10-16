import { NextLink, PrintButton, Screen } from '../components/Screen';
import { ScaleBar, StripDrawing } from '../components/drawings';
import { AppState, TabSpec } from '../state';

const STEPS_TEXT = [
  'Cut along the dashed line.',
  'Stick it to the tab face, top edge flush.',
  'Shoot each distance until grouped, then read the line under your crawl.',
];

const summary = (tab: TabSpec) =>
  `${tab.faceLength} × ${tab.faceWidth} mm · ${tab.hand} hand · zone ${tab.zoneStart}–${tab.zoneEnd} mm`;

export function Strip({ state }: { state: AppState }) {
  const { tab } = state;
  return (
    <>
      <Screen
        step={1}
        title="Print & stick"
        intro="Print at 100% scale. Check the 50 mm bar with a ruler before cutting."
        footer={<NextLink to="readings">I've shot my distances</NextLink>}
      >
        <div className="card strip-card">
          <div className="strip-preview"><StripDrawing tab={tab} /></div>
          <div className="strip-info">
            <div>
              <h2 className="label-caps">Strip</h2>
              <p className="muted">{summary(tab)}</p>
            </div>
            <div>
              <h2 className="label-caps">Scale check</h2>
              <p className="muted small">The printed page has a 50 mm bar. Measure it before you cut.</p>
            </div>
            <ol className="steps">{STEPS_TEXT.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </div>
        <PrintButton label="Print or save as PDF" />
      </Screen>

      <section className="print-only print-page">
        <h1>Baremarks sight-in strip</h1>
        <p>{summary(tab)}</p>
        <div className="print-row">
          <StripDrawing tab={tab} trueSize />
          <div className="print-notes">
            <div className="print-scale"><ScaleBar trueSize /><span>this bar = 50 mm</span></div>
            <ol>{STEPS_TEXT.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </div>
      </section>
    </>
  );
}

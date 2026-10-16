import { useEffect, useState } from 'react';
import type { Reading } from './model/fit';

export type Hand = 'right' | 'left';

export interface TabSpec {
  hand: Hand;
  /** mm, all measured from the top edge of the tab face */
  faceLength: number;
  faceWidth: number;
  zoneStart: number;
  zoneEnd: number;
}

export interface AppState {
  tab: TabSpec;
  /** metres, sorted */
  distances: number[];
  /** raw text typed per distance, keyed by distance */
  readings: Record<string, string>;
  minorMarks: number;
}

export const MINOR_RANGE = { min: 1, max: 10 };

export const defaultState: AppState = {
  tab: { hand: 'right', faceLength: 72, faceWidth: 38, zoneStart: 6, zoneEnd: 58 },
  distances: [5, 10, 18, 25, 30, 40, 50],
  readings: {},
  minorMarks: 4,
};

const STORAGE_KEY = 'baremarks:v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const saved = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultState,
      ...saved,
      tab: { ...defaultState.tab, ...saved.tab },
      readings: { ...saved.readings },
    };
  } catch {
    return defaultState;
  }
}

/** App state, kept in this browser's localStorage between visits. */
export function useAppState() {
  const [state, setState] = useState<AppState>(load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private window, blocked): the app still works for this visit
    }
  }, [state]);
  return [state, setState] as const;
}

export const zoneLength = (tab: TabSpec) => tab.zoneEnd - tab.zoneStart;

export function parseNum(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function setupProblems(state: AppState): string[] {
  const { faceLength, faceWidth, zoneStart, zoneEnd } = state.tab;
  const out: string[] = [];
  if (!(faceLength >= 20 && faceLength <= 200)) out.push('Face length should be between 20 and 200 mm.');
  if (!(faceWidth >= 10 && faceWidth <= 120)) out.push('Face width should be between 10 and 120 mm.');
  if (!(zoneStart >= 0)) out.push('The marking zone can’t start above the top edge.');
  if (!(zoneEnd > zoneStart + 5)) out.push('The marking zone needs to be at least 5 mm tall.');
  if (!(zoneEnd <= faceLength)) out.push('The marking zone must end on the tab face.');
  if (state.distances.length < 3) out.push('Pick at least three distances.');
  return out;
}

export interface ReadingRow {
  distance: number;
  text: string;
  value: number | null;
  error: string | null;
}

export function readingRows(state: AppState): ReadingRow[] {
  const max = zoneLength(state.tab);
  return state.distances.map((distance) => {
    const text = state.readings[distance] ?? '';
    const value = parseNum(text);
    let error: string | null = null;
    if (text.trim() !== '' && value === null) error = 'Not a number';
    else if (value !== null && (value < 0 || value > max)) error = `Must be 0–${max} mm`;
    return { distance, text, value: error ? null : value, error };
  });
}

export function validReadings(state: AppState): Reading[] {
  return readingRows(state)
    .filter((r): r is ReadingRow & { value: number } => r.value !== null)
    .map((r) => ({ distance: r.distance, crawl: r.value }));
}

export function fmtMetres(d: number): string {
  return `${Math.abs(d - Math.round(d)) < 0.05 ? Math.round(d) : d.toFixed(1)} m`;
}

/** How long and short lines are laid out across the tab face. */
export type TickStyle = 'big-little' | 'left' | 'right' | 'split' | 'alternating' | 'opposed';

export interface TickStyleInfo {
  id: TickStyle;
  name: string;
  description: string;
}

export const TICK_STYLES: TickStyleInfo[] = [
  { id: 'big-little', name: 'Big-little', description: 'Both centred, short lines narrower' },
  { id: 'left', name: 'Left-justified', description: 'Lines start from the left edge' },
  { id: 'right', name: 'Right-justified', description: 'Lines start from the right edge' },
  { id: 'split', name: 'Split', description: 'Short lines are stubs at both edges' },
  { id: 'alternating', name: 'Alternating', description: 'Short lines swap sides, easy to count' },
  { id: 'opposed', name: 'Opposed', description: 'Long lines left, short lines right' },
];

export const DEFAULT_TICK_STYLE: TickStyle = 'big-little';

/** [from, to] as fractions of the tab width */
export type Segment = [number, number];

/**
 * The segments one line is drawn with. `minor` is 0 for a long line and 1, 2, …
 * for the short lines above it. Every style keeps the World Archery rule of two
 * line shapes, both the same thickness.
 */
export function tickSegments(style: TickStyle, long: boolean, minor: number): Segment[] {
  switch (style) {
    case 'big-little':
      return [long ? [0.14, 0.86] : [0.34, 0.66]];
    case 'left':
      return [long ? [0.1, 0.8] : [0.1, 0.45]];
    case 'right':
      return [long ? [0.2, 0.9] : [0.55, 0.9]];
    case 'split':
      return long ? [[0.1, 0.9]] : [[0.1, 0.3], [0.7, 0.9]];
    case 'alternating':
      if (long) return [[0.14, 0.86]];
      return [minor % 2 === 1 ? [0.1, 0.45] : [0.55, 0.9]];
    case 'opposed':
      return [long ? [0.1, 0.7] : [0.55, 0.9]];
  }
}

export const isTickStyle = (v: unknown): v is TickStyle => TICK_STYLES.some((s) => s.id === v);

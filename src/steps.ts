export const STEPS = [
  { id: 'setup', label: 'tab setup' },
  { id: 'strip', label: 'sight-in strip' },
  { id: 'readings', label: 'readings' },
  { id: 'fit', label: 'curve fit' },
  { id: 'sheet', label: 'marker sheet' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

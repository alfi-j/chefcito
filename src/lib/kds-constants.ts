export const KDS_STATES = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready'
} as const;

export type KDSState = typeof KDS_STATES[keyof typeof KDS_STATES];
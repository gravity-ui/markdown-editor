export const CELL_BG_COLORS = [
    'info',
    'positive',
    'warning',
    'danger',
    'utility',
    'misc',
    'neutral',
] as const;

export type CellBgColor = (typeof CELL_BG_COLORS)[number];

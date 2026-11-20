export enum YfmTableNode {
    Table = 'yfm_table',
    Body = 'yfm_tbody',
    Row = 'yfm_tr',
    Cell = 'yfm_td',
}

export enum YfmTableAttr {
    Colspan = 'colspan',
    Rowspan = 'rowspan',
    CellBg = 'data-bg',
    CellAlign = 'data-cell-align',
    HeaderRows = 'data-header-rows',
}

export const DEFAULT_CELL_PLACEHOLDER = 'Table cell';
export const CELL_ALIGNMENTS = [
    'cell-align-top-left',
    'cell-align-top-center',
    'cell-align-top-right',
    'cell-align-center',
    'cell-align-bottom-left',
    'cell-align-bottom-right',
] as const;

export type CellAlignment = (typeof CELL_ALIGNMENTS)[number];

export const CELL_BACKGROUNDS = [
    'yellow-light',
    'red-light',
    'purple-light',
    'blue-light',
    'green-light',
    'grey',
    'yellow',
    'red',
    'purple',
    'blue',
    'green',
] as const;

export type CellBackground = (typeof CELL_BACKGROUNDS)[number];

export const CSS_BACKGROUND_ALIASES: ReadonlyMap<string, CellBackground> = new Map([
    ['gray', 'grey'],
    ['rgb(128, 128, 128)', 'grey'],
    ['rgb(255, 255, 0)', 'yellow'],
    ['rgb(255, 0, 0)', 'red'],
    ['rgb(128, 0, 128)', 'purple'],
    ['rgb(0, 0, 255)', 'blue'],
    ['rgb(0, 128, 0)', 'green'],
]);

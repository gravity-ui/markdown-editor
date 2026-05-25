export const NO_COLOR_VALUE = '';

export const CELL_BG_SWATCHES = [
    {value: NO_COLOR_VALUE, i18nKey: 'cells.bg.none'},
    {value: 'yellow-light', i18nKey: 'cells.bg.yellow-light'},
    {value: 'red-light', i18nKey: 'cells.bg.red-light'},
    {value: 'purple-light', i18nKey: 'cells.bg.purple-light'},
    {value: 'blue-light', i18nKey: 'cells.bg.blue-light'},
    {value: 'green-light', i18nKey: 'cells.bg.green-light'},
    {value: 'grey', i18nKey: 'cells.bg.grey'},
    {value: 'yellow', i18nKey: 'cells.bg.yellow'},
    {value: 'red', i18nKey: 'cells.bg.red'},
    {value: 'purple', i18nKey: 'cells.bg.purple'},
    {value: 'blue', i18nKey: 'cells.bg.blue'},
    {value: 'green', i18nKey: 'cells.bg.green'},
] as const;

export type CellBgValue = (typeof CELL_BG_SWATCHES)[number]['value'];

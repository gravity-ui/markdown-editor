export const YfmTableDecorationTypeKey = '__yfm-table-deco-type';
export const YfmTableDecorationUniqKey = '__yfm-table-deco-uniq-key';

export enum YfmTableDecorationType {
    FocusTable = 'table--focus',

    ShowRowControl = 'cell--show-row-control', // to show the row control in the cell
    ShowColumnControl = 'cell--show-column-control', // to show the column control in the cell

    OpenRowMenu = 'cell--open-row-menu', // sign of opening the row menu in the cell
    OpenColumnMenu = 'cell--open-column-menu', // sign of opening the column menu in the cell

    ActivateRowCells = 'cell--active-row',
    ActivateColumnCells = 'cell--active-column',

    ActivateDangerRowCells = 'cell--danger-row',
    ActivateDangerColumnCells = 'cell--danger-column',
}

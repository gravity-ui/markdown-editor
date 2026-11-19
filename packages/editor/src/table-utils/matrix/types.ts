import type {Fragment, Node, Schema, Slice} from 'prosemirror-model';

import type {CellRect} from '../cell-selection/geometry';

export type TableMatrixCell = {
    rect: CellRect;
    content: Fragment;
    inline: boolean;
    attrs: {
        align: string | null;
        verticalAlign?: string;
        // Keep source spelling when alignment cannot be rebuilt from CSS alone.
        rawAlign?: string;
        background: string | null;
    };
};

export type TableMatrixSource = Readonly<{
    kind: 'inline' | 'block';
    width: number;
    height: number;
    headerRows: number;
    cells: readonly TableMatrixCell[];
}>;

export type TableMatrixSnapshot = {table: Node; rect: CellRect};

// Null leaves paste to other handlers. 'invalid' rejects a recognized matrix.
export type MatrixSliceResult = TableMatrixSource | 'invalid' | null;

export type TableMatrixCellInput = {
    contributions: readonly TableMatrixCell[];
    attrs: TableMatrixCell['attrs'];
    rect: CellRect;
    header: boolean;
    target?: Node;
};

export interface TableMatrixAdapter {
    readonly kind: TableMatrixSource['kind'];
    // The extension handles standard <table> HTML without Markdown normalization.
    readonly handlesHtmlTablePaste?: boolean;
    canReadClipboardTable?(table: Node): boolean;
    // Null skips an unknown fragment. For this adapter's closed table, null rejects the paste.
    readSlice?(slice: Slice): MatrixSliceResult;
    sourceSlice?(schema: Schema, source: TableMatrixSource): Slice | null;
    writeCellHtml?(element: HTMLTableCellElement, attrs: TableMatrixCell['attrs']): void;
    writeHtml?(table: HTMLTableElement, source: TableMatrixSource): void;
    isSimpleCell(node: Node): boolean;
    readCell(node: Node): Omit<TableMatrixCell, 'rect'> | null;
    headerRows(table: Node): number | null;
    createCell(schema: Schema, input: TableMatrixCellInput): Node | null;
    buildTable(
        schema: Schema,
        rows: readonly (readonly Node[])[],
        headerRows: number,
        original?: Node,
    ): TableMatrixSnapshot | null;
}

declare module 'prosemirror-model' {
    interface NodeSpec {
        tableMatrix?: TableMatrixAdapter;
    }
}

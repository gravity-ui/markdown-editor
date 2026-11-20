import {DOMSerializer, type Schema} from 'prosemirror-model';

import type {TableMatrixAdapter, TableMatrixSource} from './types';

export function serializeMatrixHtml(
    source: TableMatrixSource,
    schema: Schema,
    adapter: TableMatrixAdapter,
    serializer = DOMSerializer.fromSchema(schema),
): string {
    const table = document.createElement('table');
    const body = table.appendChild(document.createElement('tbody'));
    const rows = Array.from({length: source.height}, () =>
        body.appendChild(document.createElement('tr')),
    );
    for (const cell of source.cells) {
        const element = document.createElement(cell.rect.top < source.headerRows ? 'th' : 'td');
        const rowspan = cell.rect.bottom - cell.rect.top;
        const colspan = cell.rect.right - cell.rect.left;
        if (rowspan > 1) element.setAttribute('rowspan', String(rowspan));
        if (colspan > 1) element.setAttribute('colspan', String(colspan));
        if (cell.attrs.align) element.style.textAlign = cell.attrs.align;
        if (cell.attrs.verticalAlign) element.style.verticalAlign = cell.attrs.verticalAlign;
        if (cell.attrs.background) element.style.backgroundColor = cell.attrs.background;
        adapter.writeCellHtml?.(element, cell.attrs);
        element.appendChild(serializer.serializeFragment(cell.content));
        rows[cell.rect.top].appendChild(element);
    }
    adapter.writeHtml?.(table, source);
    return table.outerHTML;
}

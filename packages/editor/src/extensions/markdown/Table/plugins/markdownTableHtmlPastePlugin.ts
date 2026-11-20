import {Plugin} from 'prosemirror-state';

import {findHtmlTable} from 'src/table-utils/matrix/html-table';
import {MAX_ADDED_TABLE_CELLS, placeTableCells} from 'src/table-utils/matrix/rows';
import {getMatrixPasteTarget} from 'src/table-utils/matrix/target';

import {CellAlign, TableAttrs} from '../const';

const BLOCK_ELEMENTS = new Set([
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'BR',
    'DD',
    'DIV',
    'DL',
    'DT',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HEADER',
    'HR',
    'LI',
    'MAIN',
    'NAV',
    'OL',
    'P',
    'PRE',
    'SECTION',
    'TABLE',
    'TBODY',
    'TD',
    'TFOOT',
    'TH',
    'THEAD',
    'TR',
    'UL',
]);

export const markdownTableHtmlPastePlugin = () => {
    // HTML transforms also run on external drop.
    let dropEvent: DragEvent | null = null;
    return new Plugin({
        props: {
            handleDOMEvents: {
                drop(_view, event) {
                    dropEvent = event;
                    queueMicrotask(() => {
                        if (dropEvent === event) dropEvent = null;
                    });
                    return false;
                },
            },
            transformPastedHTML(html, view) {
                if (
                    (dropEvent && dropEvent.eventPhase !== Event.NONE) ||
                    !getMatrixPasteTarget(view.state)
                )
                    return html;
                const source = findHtmlTable(html);
                if (!source?.standalone) return html;
                const {table} = source;
                if (table.hasAttribute('data-pm-slice') || table.querySelector('[data-pm-slice]'))
                    return html;
                const rows = Array.from(table.rows);
                const body = document.createElement('tbody');
                const expanded = expandCells(rows);
                for (const [top, row] of rows.entries()) {
                    const header =
                        row.parentElement?.tagName === 'THEAD' ||
                        (row.cells.length > 0 &&
                            Array.from(row.cells).every((cell) => cell.tagName === 'TH'));
                    const cells = expanded?.[top] ?? Array.from(row.cells);
                    const result = document.createElement('tr');
                    for (const cell of cells) {
                        let element = cell ?? document.createElement(header ? 'th' : 'td');
                        if (header && element.tagName !== 'TH') {
                            const head = document.createElement('th');
                            for (const attr of Array.from(element.attributes))
                                head.setAttribute(attr.name, attr.value);
                            while (element.firstChild) head.appendChild(element.firstChild);
                            element = head;
                        }
                        element.removeAttribute('rowspan');
                        element.removeAttribute('colspan');
                        const align =
                            element.getAttribute(TableAttrs.CellAlign) ||
                            element.style.textAlign ||
                            element.getAttribute('align');
                        element.setAttribute(
                            TableAttrs.CellAlign,
                            Object.values<string>(CellAlign).includes(align ?? '')
                                ? align!
                                : CellAlign.Left,
                        );
                        separateBlocks(element);
                        result.appendChild(element);
                    }
                    body.appendChild(result);
                }
                return body.outerHTML;
            },
        },
        view: () => ({
            destroy: () => {
                dropEvent = null;
            },
        }),
    });
};

function expandCells(rows: HTMLTableRowElement[]): (HTMLTableCellElement | undefined)[][] | null {
    const placed = placeTableCells(
        rows.map((row) => Array.from(row.cells)),
        (cell, top) => {
            const group = rows[top].parentElement;
            const remaining =
                group instanceof HTMLTableSectionElement
                    ? group.rows.length - rows[top].sectionRowIndex
                    : rows.length - top;
            return {rowspan: Math.min(cell.rowSpan || remaining, remaining), colspan: cell.colSpan};
        },
    );
    // Keep large spans as real cells instead of expanding the grid.
    if (!placed || placed.width * rows.length - placed.cells.length > MAX_ADDED_TABLE_CELLS)
        return null;
    const result: (HTMLTableCellElement | undefined)[][] = rows.map(() =>
        Array.from({length: placed.width}),
    );
    for (const {cell, rect} of placed.cells) result[rect.top][rect.left] = cell;
    return result;
}

function separateBlocks(parent: Element): void {
    for (const child of Array.from(parent.children)) {
        separateBlocks(child);
        if (BLOCK_ELEMENTS.has(child.tagName)) {
            child.before(' ');
            while (child.firstChild) child.before(child.firstChild);
            child.replaceWith(' ');
        }
    }
}

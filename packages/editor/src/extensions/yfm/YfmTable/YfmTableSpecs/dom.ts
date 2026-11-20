import {
    CELL_ALIGNMENTS,
    CELL_BACKGROUNDS,
    CSS_BACKGROUND_ALIASES,
    type CellAlignment,
    type CellBackground,
    YfmTableAttr,
} from './const';

export function getTableAttrs(dom: HTMLElement) {
    const attr = dom.getAttribute(YfmTableAttr.HeaderRows);
    const {rows} = dom as HTMLTableElement;
    if (attr !== null) {
        const count = Math.min(rows.length, Math.max(0, parseInt(attr, 10) || 0));
        return {[YfmTableAttr.HeaderRows]: count};
    }

    let headerRows = 0;
    while (headerRows < rows.length && isHeaderRow(rows[headerRows])) headerRows++;
    return {[YfmTableAttr.HeaderRows]: headerRows};
}

export function getCellAttrs(dom: HTMLElement) {
    const cell = dom as HTMLTableCellElement;
    return {
        [YfmTableAttr.Colspan]: cell.hasAttribute(YfmTableAttr.Colspan)
            ? String(cell.colSpan)
            : null,
        [YfmTableAttr.Rowspan]: getRowSpan(cell),
        [YfmTableAttr.CellAlign]: getCellAlign(cell),
        [YfmTableAttr.CellBg]: getCellBackground(cell),
    };
}

function isHeaderRow(row: HTMLTableRowElement) {
    return (
        row.parentElement?.tagName === 'THEAD' ||
        (row.cells.length > 0 && Array.from(row.cells).every((cell) => cell.tagName === 'TH'))
    );
}

function getRowSpan(cell: HTMLTableCellElement): string | null {
    if (!cell.hasAttribute(YfmTableAttr.Rowspan)) return null;

    const row = cell.closest('tr');
    const group = row?.closest<HTMLTableSectionElement>('thead, tbody, tfoot');
    const span = cell.rowSpan;
    if (!row || !group || row.parentElement !== group) return String(span || 1);

    const remaining = group.rows.length - row.sectionRowIndex;
    return String(span === 0 ? remaining : Math.min(span, remaining));
}

function getCellAlign(dom: HTMLElement): CellAlignment | null {
    const native = dom.getAttribute(YfmTableAttr.CellAlign);
    if (isSupportedValue(native, CELL_ALIGNMENTS)) return native;

    const horizontal = normalizeAlignment(
        dom.style.textAlign || dom.getAttribute('align') || dom.getAttribute('cell-align'),
    );
    const vertical = normalizeAlignment(dom.style.verticalAlign || dom.getAttribute('valign'));
    if (!horizontal && !vertical) return null;
    if (isSupportedValue(horizontal, CELL_ALIGNMENTS)) return horizontal;
    if (vertical === 'middle' && (!horizontal || horizontal === 'center'))
        return 'cell-align-center';

    const align = `cell-align-${vertical || 'top'}-${horizontal || 'left'}`;
    return isSupportedValue(align, CELL_ALIGNMENTS) ? align : null;
}

function normalizeAlignment(value: string | null) {
    return value?.trim().toLowerCase() ?? '';
}

function getCellBackground(dom: HTMLElement): CellBackground | null {
    const native = dom.getAttribute(YfmTableAttr.CellBg);
    if (isSupportedValue(native, CELL_BACKGROUNDS)) return native;

    let css = dom.style.backgroundColor;
    if (!css) {
        const legacy = dom.getAttribute('bgcolor');
        if (!legacy) return null;
        const {style} = dom.ownerDocument.createElement('span');
        style.backgroundColor = legacy;
        css = style.backgroundColor;
    }
    return (
        CSS_BACKGROUND_ALIASES.get(css) ?? (isSupportedValue(css, CELL_BACKGROUNDS) ? css : null)
    );
}

function isSupportedValue<T extends string>(
    value: string | null,
    supported: readonly T[],
): value is T {
    const values: readonly (string | null)[] = supported;
    return values.includes(value);
}

import {closeHistory} from 'prosemirror-history';
import {Slice} from 'prosemirror-model';
import {Plugin, type Transaction} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import {TableCellSelection} from 'src/table-utils/cell-selection/selection';
import {prepareMatrixCut} from 'src/table-utils/matrix/cut';
import {findHtmlTable} from 'src/table-utils/matrix/html-table';
import {prepareMatrixPaste} from 'src/table-utils/matrix/paste';
import {pastePreparedSlice} from 'src/table-utils/matrix/paste-slice';
import {readMatrixSlice} from 'src/table-utils/matrix/slice';
import {getMatrixPasteTarget} from 'src/table-utils/matrix/target';
import {DataTransferType} from 'src/utils/clipboard';

import {type ClipboardPluginOptions, setClipboardData} from './clipboard';
import {readMatrixPayload, serializeMatrixSelection, tableMatrixSection} from './matrix-codec';
import {getClipboardMetadata} from './metadata';

type MatrixClipboardOptions = ClipboardPluginOptions & {
    parseTableText?: WysiwygEditor.Context['parseClipboardTableText'];
};

export function matrixClipboard(options: MatrixClipboardOptions): Plugin {
    return new Plugin({
        props: {
            handleDOMEvents: {
                copy: (view, event) => copyMatrix(view, event, options, false),
                cut: (view, event) => copyMatrix(view, event, options, true),
                paste(view, event) {
                    if (!view.editable) {
                        event.preventDefault();
                        return true;
                    }
                    const data = event.clipboardData;
                    if (!data || !getMatrixPasteTarget(view.state)) return false;
                    if (!pasteClipboardData(view, event, data, options)) return false;
                    event.preventDefault();
                    if (options.pasteFileHandler) {
                        for (const file of Array.from(data.files)) options.pasteFileHandler(file);
                    }
                    return true;
                },
            },
            handlePaste(view, _event, slice) {
                if (!view.editable) return true;
                const target = getMatrixPasteTarget(view.state);
                if (!target) return false;
                const matrix = readMatrixSlice(slice);
                if (!matrix) return false;
                if (matrix === 'invalid') return true;
                const transaction = prepareMatrixPaste(view.state, matrix.source, target);
                if (transaction) dispatchMatrix(view, transaction, 'paste');
                return true;
            },
        },
    });
}

function pasteClipboardData(
    view: EditorView,
    event: ClipboardEvent,
    data: DataTransfer,
    options: MatrixClipboardOptions,
): boolean {
    const payload = getClipboardMetadata(data, tableMatrixSection);
    if (payload) {
        const slice = readMatrixPayload(payload, view.state.schema, options.logger);
        if (slice) return pastePreparedSlice(view, event, slice);
    }

    const html = data.getData(DataTransferType.Html);
    const htmlTable = findHtmlTable(html);
    if (htmlTable?.standalone) return view.pasteHTML(html, event) || Boolean(payload);
    if (payload) return true;
    if (htmlTable) {
        // Mixed HTML stays together. Editor markup takes precedence for ordinary paste.
        return !data.types.includes(DataTransferType.Yfm) && view.pasteHTML(html, event);
    }
    const markup = data.getData(DataTransferType.Yfm);
    if (!markup) {
        const slice = options.parseTableText?.(
            data.getData(DataTransferType.Text),
            options.textParser,
        );
        return slice ? pastePreparedSlice(view, event, slice) : false;
    }
    let slice: Slice;
    try {
        slice = new Slice(options.mdParser.parse(markup).content, 0, 0);
    } catch {
        return false;
    }
    return slice.content.childCount === 1 && slice.content.firstChild?.type.spec.tableMatrix
        ? pastePreparedSlice(view, event, slice)
        : false;
}

function copyMatrix(
    view: EditorView,
    event: ClipboardEvent,
    options: MatrixClipboardOptions,
    cut: boolean,
): boolean {
    const {selection} = view.state;
    if (!(selection instanceof TableCellSelection)) return false;
    event.preventDefault();
    if ((cut && !view.editable) || !event.clipboardData) return true;
    try {
        const result = serializeMatrixSelection(selection, view, options.serializer);
        if (!result) return true;
        const transaction = cut ? prepareMatrixCut(view.state, selection) : null;
        if (cut && !transaction) return true;
        setClipboardData(event.clipboardData, result);
        if (transaction && (transaction.docChanged || !transaction.selection.eq(selection))) {
            dispatchMatrix(view, transaction, 'cut');
        }
    } catch {
        options.logger.warn('Cannot copy table matrix', {operation: cut ? 'cut' : 'copy'});
    }
    return true;
}

function dispatchMatrix(view: EditorView, transaction: Transaction, event: 'cut' | 'paste'): void {
    // Keep this operation separate from earlier edits in undo history.
    view.dispatch(closeHistory(transaction.setMeta('uiEvent', event).scrollIntoView()));
    // Close the group after all appended changes, before the next edit.
    // This empty transaction adds no undo step but calls onChange again.
    view.dispatch(closeHistory(view.state.tr));
}

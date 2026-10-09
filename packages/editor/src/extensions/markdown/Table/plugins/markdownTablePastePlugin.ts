import {type ExtensionDeps, type Parser, trackTransactionMetrics} from '#core';
import {Slice} from '#pm/model';
import {Plugin} from '#pm/state';
import type {EditorView} from '#pm/view';

import {isInsideCode} from '../../../behavior/Clipboard/code';
import {DataTransferType} from '../../../behavior/Clipboard/utils';
import {TableNode} from '../const';

export const markdownTablePastePlugin = ({textParser}: ExtensionDeps) =>
    new Plugin({
        props: {
            handleDOMEvents: {
                paste(view, event) {
                    const {clipboardData} = event;
                    if (!clipboardData || !shouldHandlePaste(view, clipboardData)) return false;

                    const slice = parsePipedMarkdownTable(
                        clipboardData.getData(DataTransferType.Text),
                        textParser,
                    );
                    if (!slice) return false;

                    event.preventDefault();
                    view.dispatch(
                        trackTransactionMetrics(view.state.tr.replaceSelection(slice), 'paste', {
                            clipboardDataFormat: DataTransferType.Text,
                        }),
                    );

                    return true;
                },
            },
        },
    });

export function isPipeTableCandidate(text: string): boolean {
    const trimmed = text.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|');
}

function shouldHandlePaste(view: EditorView, clipboardData: DataTransfer): boolean {
    return !clipboardData.types.includes(DataTransferType.Yfm) && !isInsideCode(view.state);
}

function parsePipedMarkdownTable(text: string, parser: Parser): Slice | null {
    if (!isPipeTableCandidate(text)) return null;

    try {
        const content = parser.parse(text).content;
        return content.childCount === 1 && content.firstChild?.type.name === TableNode.Table
            ? new Slice(content, 0, 0)
            : null;
    } catch {
        return null;
    }
}

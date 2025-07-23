import dd from 'ts-dedent';

import {getLoggerFromState} from '#core';
import {Fragment, type Mark} from '#pm/model';
import {type EditorState, Plugin} from '#pm/state';

import {DataTransferType, isFilesOnly, isIosSafariShare} from './utils';

const isCodeMark = (mark: Mark) => mark.type.spec.code;

export function isInsideCode(state: EditorState): false | 'block' | 'inline' {
    if (isInsideBlockCode(state)) return 'block';
    if (isInsideInlineCode(state)) return 'inline';
    return false;
}

export function isInsideBlockCode(state: EditorState): boolean {
    // it is enough to check only $from
    // when pasting, the content is inserted into a block with the type from $from
    return Boolean(state.selection.$from.parent.type.spec.code);
}

export function isInsideInlineCode(state: EditorState): boolean {
    // same as for block code
    const fromHasCodeMark = state.selection.$from.marks().some(isCodeMark);
    if (state.selection.empty) {
        return fromHasCodeMark || (state.storedMarks ?? []).some(isCodeMark);
    }
    return fromHasCodeMark;
}

/**
 * This plugin handles paste into any type of code: code block or code mark.
 * If selection is inside code, it always prevents execution of all next paste handlers.
 * It takes a value from following clipboard data types: uri-list, files or text data.
 */
export const handlePasteIntoCodePlugin = () => {
    return new Plugin({
        props: {
            handleDOMEvents: {
                paste(view, event) {
                    if (!event.clipboardData) return false;
                    const {clipboardData} = event;

                    const codeType = isInsideCode(view.state);
                    if (!codeType) return false;

                    let text: string;
                    let dataFormat: string;

                    if (isIosSafariShare(clipboardData)) {
                        dataFormat = DataTransferType.UriList;
                        text = clipboardData.getData(DataTransferType.UriList);
                    } else if (isFilesOnly(clipboardData)) {
                        dataFormat = DataTransferType.Files;
                        text = Array.from(clipboardData.files)
                            .map((file) => file.name)
                            .join(' ');
                    } else {
                        dataFormat = DataTransferType.Text;
                        text = dd(clipboardData.getData(DataTransferType.Text));
                    }

                    if (codeType === 'inline') {
                        text = text.replaceAll('\n', '↵');
                    }

                    const {state, dispatch} = view;

                    getLoggerFromState(state).event({
                        codeType,
                        dataFormat,
                        empty: !text,
                        domEvent: 'paste',
                        event: 'paste-into-code',
                        dataTypes: clipboardData.types,
                    });

                    event.preventDefault();
                    const {tr} = state;
                    if (text) tr.replaceSelectionWith(state.schema.text(text), true);
                    else tr.replaceWith(tr.selection.from, tr.selection.to, Fragment.empty);
                    dispatch(tr.scrollIntoView());

                    return true;
                },
            },
        },
    });
};

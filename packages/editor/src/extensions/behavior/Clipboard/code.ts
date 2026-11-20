import dd from 'ts-dedent';

import {getLoggerFromState} from '#core';
import {Fragment} from '#pm/model';
import {Plugin} from '#pm/state';
import {DataTransferType, isFilesOnly, isIosSafariShare} from 'src/utils/clipboard';
import {isInsideCode} from 'src/utils/code';
import {isCodeBlock} from 'src/utils/nodes';

export {isInsideCode, isInsideBlockCode, isInsideInlineCode} from 'src/utils/code';

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
                        text = clipboardData.getData(DataTransferType.Text);
                        if (!isCodeBlock(view.state.selection.$from.parent)) text = dd(text);
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

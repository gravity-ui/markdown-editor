import {Plugin, TextSelection} from 'prosemirror-state';
import {isTextSelection} from '../../../utils/selection';
import type {ExtensionDeps, Parser} from '../../../core';
import {DataTransferType, isIosSafariShare} from '../../behavior/Clipboard/utils';
import {LinkAttr, linkType} from './index';

export function linkPasteEnhance({parser}: ExtensionDeps) {
    return new Plugin({
        props: {
            handleDOMEvents: {
                paste(view, e): boolean {
                    const {state, dispatch} = view;
                    const sel = state.selection;
                    if (!isTextSelection(sel)) return false;
                    const {$from, $to} = sel;
                    if ($from.pos !== $to.pos && $from.sameParent($to)) {
                        const url = getUrl(e.clipboardData, parser);
                        if (url) {
                            const tr = state.tr.addMark(
                                $from.pos,
                                $to.pos,
                                linkType(state.schema).create({
                                    [LinkAttr.Href]: url,
                                }),
                            );
                            dispatch(tr.setSelection(TextSelection.create(tr.doc, $to.pos)));
                            e.preventDefault();
                            return true;
                        }
                    }
                    return false;
                },
            },
        },
    });
}

function getUrl(data: DataTransfer | null, parser: Parser): string | null {
    if (!data || data.types.includes(DataTransferType.Yfm)) return null;
    if (isIosSafariShare(data)) return data.getData(DataTransferType.UriList);
    // TODO: should we process HTML here?
    const text = data.getData(DataTransferType.Text);
    const match = parser.matchLinks(text);
    if (match?.[0]?.raw === text) return match[0].url;
    return null;
}

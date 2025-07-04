import {Plugin, TextSelection, type Transaction} from 'prosemirror-state';

import {type ExtensionDeps, type Parser, getLoggerFromState} from '../../../core';
import {isNodeSelection, isTextSelection} from '../../../utils/selection';
import {DataTransferType, isIosSafariShare} from '../../behavior/Clipboard/utils';
import {imageType} from '../Image';

import {LinkAttr, linkType} from './index';

export function linkPasteEnhance({markupParser: parser}: ExtensionDeps) {
    return new Plugin({
        props: {
            handleDOMEvents: {
                paste(view, e): boolean {
                    const logger = getLoggerFromState(view.state).nested({
                        plugin: 'link-paste-enhance',
                        domEvent: 'paste',
                    });

                    const {state, dispatch} = view;
                    const sel = state.selection;
                    let tr: Transaction | null = null;

                    if (
                        isTextSelection(sel) ||
                        (isNodeSelection(sel) && sel.node.type === imageType(state.schema))
                    ) {
                        const {$from, $to} = sel;
                        if ($from.pos === $to.pos) {
                            const url = getUrl(e.clipboardData, parser);
                            if (url) {
                                const linkMarkType = linkType(state.schema);
                                tr = state.tr.replaceSelectionWith(
                                    state.schema.text(url, [
                                        ...$from
                                            .marks()
                                            .filter((mark) => mark.type !== linkMarkType),
                                        linkMarkType.create({[LinkAttr.Href]: url}),
                                    ]),
                                    false,
                                );
                                logger.event({
                                    event: 'paste-url',
                                });
                            }
                        } else if ($from.sameParent($to)) {
                            const url = getUrl(e.clipboardData, parser);
                            if (url) {
                                tr = state.tr.addMark(
                                    $from.pos,
                                    $to.pos,
                                    linkType(state.schema).create({
                                        [LinkAttr.Href]: url,
                                    }),
                                );
                                tr.setSelection(TextSelection.create(tr.doc, $to.pos));
                                logger.event({
                                    event: 'paste-url-on-text',
                                });
                            }
                        }
                    }

                    if (tr) {
                        dispatch(tr.scrollIntoView());
                        e.preventDefault();
                        return true;
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
    if (match?.[0]) {
        const {raw, url} = match[0];
        if (raw === text) return url;
        if (text.endsWith('?') && raw + '?' === text && parser.validateLink(text)) {
            return parser.normalizeLink(text);
        }
    }
    return null;
}

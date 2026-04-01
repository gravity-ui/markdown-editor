import {Plugin, TextSelection, type Transaction} from 'prosemirror-state';

import {type ExtensionDeps, type Parser, getLoggerFromState} from '../../../core';
import {isNodeSelection, isTextSelection} from '../../../utils/selection';
import {DataTransferType, isIosSafariShare} from '../../behavior/Clipboard/utils';
import {imageType} from '../Image';

import {LinkAttr, linkType} from './index';

type PastedLink = {href: string; label: string};

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
                            const pasted = getPastedLink(e.clipboardData, parser);
                            if (pasted) {
                                const linkMarkType = linkType(state.schema);
                                tr = state.tr.replaceSelectionWith(
                                    state.schema.text(pasted.label, [
                                        ...$from
                                            .marks()
                                            .filter((mark) => mark.type !== linkMarkType),
                                        linkMarkType.create({[LinkAttr.Href]: pasted.href}),
                                    ]),
                                    false,
                                );
                                logger.event({
                                    event: 'paste-url',
                                });
                            }
                        } else if ($from.sameParent($to)) {
                            const pasted = getPastedLink(e.clipboardData, parser);
                            if (pasted) {
                                tr = state.tr.addMark(
                                    $from.pos,
                                    $to.pos,
                                    linkType(state.schema).create({
                                        [LinkAttr.Href]: pasted.href,
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

function getPastedLink(data: DataTransfer | null, parser: Parser): PastedLink | null {
    if (!data || data.types.includes(DataTransferType.Yfm)) return null;
    if (isIosSafariShare(data)) {
        const href = data.getData(DataTransferType.UriList);
        if (!href) {
            return null;
        }

        const trimmed = href.trim();
        return {href: trimmed, label: trimmed};
    }
    // TODO: should we process HTML here?
    const text = data.getData(DataTransferType.Text);
    const match = parser.matchLinks(text);
    if (match?.[0]) {
        const {raw} = match[0];
        if (raw === text) {
            const href = parser.normalizeLink(text);
            if (!parser.validateLink(href)) {
                return null;
            }

            return {href, label: text};
        }
        if (text.endsWith('?') && raw + '?' === text && parser.validateLink(text)) {
            const href = parser.normalizeLink(text);
            return {href, label: text};
        }
    }
    return null;
}

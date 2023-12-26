import {Fragment, Schema, Slice} from 'prosemirror-model';
import {EditorState, Plugin, Selection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import {Parser, Serializer, trackTransactionMetrics} from '../../../core';
import {logger} from '../../../logger';
import '../../../types/spec';
import {tryCatch} from '../../../utils/helpers';
import {isNodeSelection, isTextSelection, isWholeSelection} from '../../../utils/selection';
import {serializeForClipboard} from '../../../utils/serialize-for-clipboard';
import {BaseNode, pType} from '../../base/BaseSchema';

import {isInsideCode} from './code';
import {DataTransferType, extractTextContentFromHtml, isIosSafariShare} from './utils';

export type ClipboardPluginOptions = {
    yfmParser: Parser;
    textParser: Parser;
    serializer: Serializer;
    pasteFileHandler?: (file: File) => void;
};

export const clipboard = ({
    textParser,
    yfmParser,
    serializer,
    pasteFileHandler,
}: ClipboardPluginOptions) => {
    return new Plugin({
        props: {
            handleDOMEvents: {
                copy(view, e) {
                    if (!e.clipboardData) return false;
                    const result = serializeSelected(view, serializer);
                    if (result) {
                        e.preventDefault();
                        setClipboardData(e.clipboardData, result);
                        return true;
                    }
                    return false;
                },
                cut(view, e) {
                    if (!e.clipboardData) return false;
                    const result = serializeSelected(view, serializer);
                    if (result) {
                        e.preventDefault();
                        setClipboardData(e.clipboardData, result);
                        view.dispatch(
                            view.state.tr
                                .deleteSelection()
                                .scrollIntoView()
                                .setMeta('uiEvent', 'cut'),
                        );
                        return true;
                    }
                    return false;
                },
                paste(view, e) {
                    if (!e.clipboardData) return false;

                    let data: string;
                    let isPasteHandled = false;

                    if (
                        isIosSafariShare(e.clipboardData) &&
                        (data = e.clipboardData.getData(DataTransferType.UriList))
                    ) {
                        const schema: Schema = view.state.schema;
                        view.dispatch(
                            trackTransactionMetrics(
                                view.state.tr.replaceSelection(
                                    // paste link inline
                                    new Slice(
                                        Fragment.from(
                                            pType(schema).create(null, schema.text(data)),
                                        ),
                                        1,
                                        1,
                                    ),
                                ),
                                'paste',
                                {clipboardDataFormat: DataTransferType.UriList},
                            ),
                        );
                        isPasteHandled = true;
                        e.preventDefault();
                        return true;
                    }

                    if (
                        !e.clipboardData.types.includes(DataTransferType.Yfm) &&
                        (data = e.clipboardData.getData(DataTransferType.Html))
                    ) {
                        const textFromHtml = extractTextContentFromHtml(data);
                        if (textFromHtml) {
                            const res = tryCatch(() => textParser.parse(textFromHtml));
                            if (res.success) {
                                const docNode = res.result;
                                const slice = getSliceFromMarkupFragment(docNode.content);
                                view.dispatch(
                                    trackTransactionMetrics(
                                        view.state.tr.replaceSelection(slice),
                                        'paste',
                                        {clipboardDataFormat: DataTransferType.Html},
                                    ),
                                );
                                isPasteHandled = true;
                            } else {
                                logger.error(res.error);
                                console.error(res.error);
                            }
                        } else return false; // default html pasting
                    }

                    if (
                        !isPasteHandled &&
                        ((data = e.clipboardData.getData(DataTransferType.Yfm)) ||
                            (data = e.clipboardData.getData(DataTransferType.Text)))
                    ) {
                        let parser: Parser;
                        let dataFormat: string;
                        if (e.clipboardData.types.includes(DataTransferType.Yfm)) {
                            parser = yfmParser;
                            dataFormat = DataTransferType.Yfm;
                        } else {
                            parser = textParser;
                            dataFormat = DataTransferType.Text;
                        }
                        const codeType = isInsideCode(view.state);
                        if (codeType) {
                            const schema: Schema = view.state.schema;
                            view.dispatch(
                                trackTransactionMetrics(
                                    view.state.tr.replaceSelectionWith(
                                        schema.text(codeType === 'inline' ? data.trim() : data),
                                    ),
                                    'paste',
                                    {clipboardDataFormat: dataFormat, code: codeType},
                                ),
                            );
                            isPasteHandled = true;
                        } else {
                            const res = tryCatch(() => parser.parse(data));
                            if (res.success) {
                                const docNode = res.result;
                                const slice = getSliceFromMarkupFragment(docNode.content);
                                view.dispatch(
                                    trackTransactionMetrics(
                                        view.state.tr.replaceSelection(slice),
                                        'paste',
                                        {clipboardDataFormat: dataFormat},
                                    ),
                                );
                                isPasteHandled = true;
                            } else {
                                logger.error(res.error);
                                console.error(res.error);
                            }
                        }
                    }

                    if (e.clipboardData.files.length && pasteFileHandler) {
                        for (const file of Array.from(e.clipboardData.files)) {
                            pasteFileHandler(file);
                        }
                        isPasteHandled = true;
                    }

                    if (isPasteHandled) {
                        e.preventDefault();
                        return true;
                    }

                    return false;
                },
            },
        },
    });
};

function getSliceFromMarkupFragment(fragment: Fragment) {
    let start = 0;
    let end = 0;
    if (fragment.firstChild?.isTextblock) {
        start = 1;
        if (fragment.childCount === 1) {
            end = 1;
        }
    }
    return new Slice(fragment, start, end);
}

type SerializeResult = {
    text: string;
    html: string;
    markup: string;
};
function serializeSelected(view: EditorView, serializer: Serializer): SerializeResult | null {
    if (view.state.selection.empty) return null;
    const markup = serializer.serialize(getCopyContent(view.state).content);
    const {dom, text} = serializeForClipboard(view, view.state.selection.content());
    return {markup, text, html: dom.innerHTML};
}

function setClipboardData(data: DataTransfer, result: SerializeResult) {
    data.clearData();
    data.setData(DataTransferType.Yfm, result.markup);
    data.setData(DataTransferType.Html, result.html);
    data.setData(DataTransferType.Text, result.text);
}

function getCopyContent(state: EditorState): Slice {
    const sel = state.selection;

    if (isWholeSelection(sel)) {
        return new Slice(state.doc.content, 0, 0);
    }

    if (isTextSelectionWithinSameTextBlock(sel)) {
        return new Slice(createFragmentFromInlineSelection(state), 0, 0);
    }

    if (isNodeSelection(sel)) {
        const {node} = sel;
        if (node.type.spec.complex) {
            if (node.isTextblock) {
                return new Slice(
                    Fragment.from(state.schema.node(BaseNode.Paragraph, {}, node.content)),
                    1,
                    1,
                );
            } else {
                const {complex} = node.type.spec;
                if (complex === 'root') {
                    return new Slice(Fragment.from(node), 1, 1);
                } else if (complex === 'leaf') {
                    return new Slice(Fragment.from(node.content), 1, 1);
                } else {
                    // TODO: handle copy of intermediate complex block node
                }
            }
        } else {
            return new Slice(Fragment.from(node), 1, 1);
        }
    }

    let slice = getSelectionContent(sel);

    // replace first node with paragraph if needed
    if (
        slice.content.firstChild?.isTextblock &&
        slice.content.firstChild.type.name !== BaseNode.Paragraph
    ) {
        let shouldTransformFirstChildToPara = true;
        const {firstChild} = slice.content;

        // if all text selected inside first node, don't replace it with paragraph
        if (firstChild.eq(sel.$from.parent)) {
            shouldTransformFirstChildToPara = false;
        }

        if (shouldTransformFirstChildToPara) {
            slice = new Slice(
                slice.content.replaceChild(
                    0,
                    state.schema.node(BaseNode.Paragraph, {}, firstChild.content),
                ),
                slice.openStart,
                slice.openStart,
            );
        }
    }

    return slice;
}

function isTextSelectionWithinSameTextBlock(sel: Selection) {
    return isTextSelection(sel) && sel.$from.sameParent(sel.$to) && sel.$from.parent.isTextblock;
}

function createFragmentFromInlineSelection(state: EditorState) {
    const sel = state.selection;
    const inlineSlice = state.doc.slice(sel.from, sel.to);
    const isComplexTextblock = Boolean(sel.$from.parent.type.spec.complex);
    const isAllContentSelected = sel.$from.parent.content.eq(inlineSlice.content);
    if (isComplexTextblock || !isAllContentSelected) {
        // copy selected inline content to paragraph if current node is complex
        // or if only part of it's content was selected
        return Fragment.from(state.schema.node(BaseNode.Paragraph, {}, inlineSlice.content));
    }
    return Fragment.from(sel.$from.parent.copy(inlineSlice.content));
}

/**
 * Like `selection.content()`, but smarter.
 * Copy a structure of complex nodes,
 * e.g. if select part of cut title it creates slice with yfm-cut –> yfm-cut-title -> selected text
 * it works well with simple nodes, but to handle cases as described above, custom logic needed
 */
function getSelectionContent({$from, to}: Selection) {
    const sharedNodeType = $from.node($from.sharedDepth(to)).type;
    const sharedNodeComplex = sharedNodeType.spec.complex;
    const includeParents = sharedNodeComplex && sharedNodeComplex !== 'leaf';
    return $from.doc.slice($from.pos, to, includeParents);
}

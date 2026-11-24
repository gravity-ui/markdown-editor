import {type Parser, type Serializer, trackTransactionMetrics} from '#core';
import {Fragment, type Node, type ResolvedPos, Slice} from '#pm/model';
import {type EditorState, Plugin, type Selection} from '#pm/state';
import type {EditorView} from '#pm/view';
import {isListItemNode} from 'src/extensions/markdown/Lists/utils';
import {type Logger2, globalLogger} from 'src/logger';
import 'src/types/spec';
import {tryCatch} from 'src/utils/helpers';
import {isNodeSelection, isTextSelection, isWholeSelection} from 'src/utils/selection';

import {BaseNode, pType} from '../../base/BaseSchema';

import {getSelectionContent} from './selection-content';
import {trimTextSelection} from './trim-selection';
import {DataTransferType, extractTextContentFromHtml, isIosSafariShare, trimContent} from './utils';

export type ClipboardPluginOptions = {
    logger: Logger2.ILogger;
    mdParser: Parser;
    textParser: Parser;
    serializer: Serializer;
    pasteFileHandler?: (file: File) => void;
};

export const clipboard = ({
    logger,
    textParser,
    mdParser,
    serializer,
    pasteFileHandler,
}: ClipboardPluginOptions) => {
    return new Plugin({
        props: {
            handleDOMEvents: {
                copy: (view, event) => copyOrCutSelection(view, event, serializer),
                cut: (view, event) => copyOrCutSelection(view, event, serializer),
                paste(view, e) {
                    const data = e.clipboardData;
                    if (!data) return false;

                    const pasteLogger = logger.nested({
                        domEvent: 'paste',
                        dataTypes: data.types,
                    });

                    const uri = isIosSafariShare(data) && data.getData(DataTransferType.UriList);
                    if (uri) {
                        const {schema} = view.state;
                        const paragraph = pType(schema).create(null, schema.text(uri));
                        view.dispatch(
                            trackTransactionMetrics(
                                view.state.tr.replaceSelection(
                                    new Slice(Fragment.from(paragraph), 1, 1),
                                ),
                                'paste',
                                {clipboardDataFormat: DataTransferType.UriList},
                            ),
                        );
                        pasteLogger.event({event: 'paste-uri-list'});
                        e.preventDefault();
                        return true;
                    }

                    let isPasteHandled = false;
                    const hasMarkup = data.types.includes(DataTransferType.Yfm);
                    const html = !hasMarkup && data.getData(DataTransferType.Html);
                    if (html) {
                        const text = extractTextContentFromHtml(html);
                        if (!text) return false; // Let ProseMirror parse rich HTML.
                        isPasteHandled = pasteParsedText(
                            view,
                            text,
                            textParser,
                            DataTransferType.Html,
                            pasteLogger,
                        );
                    }

                    if (!isPasteHandled) {
                        const text =
                            data.getData(DataTransferType.Yfm) ||
                            data.getData(DataTransferType.Text);
                        if (text) {
                            isPasteHandled = pasteParsedText(
                                view,
                                text,
                                hasMarkup ? mdParser : textParser,
                                hasMarkup ? DataTransferType.Yfm : DataTransferType.Text,
                                pasteLogger,
                            );
                        }
                    }

                    if (data.files.length && pasteFileHandler) {
                        pasteLogger.event({
                            event: 'paste-files',
                        });
                        for (const file of Array.from(data.files)) {
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

function copyOrCutSelection(
    view: EditorView,
    event: ClipboardEvent,
    serializer: Serializer,
): boolean {
    const cut = event.type === 'cut';
    if (cut && !view.editable) {
        event.preventDefault();
        return true;
    }
    if (!event.clipboardData) return false;
    const result = serializeSelected(view, serializer);
    if (!result) return false;
    event.preventDefault();
    setClipboardData(event.clipboardData, result);
    if (cut)
        view.dispatch(view.state.tr.deleteSelection().scrollIntoView().setMeta('uiEvent', 'cut'));
    return true;
}

function pasteParsedText(
    view: EditorView,
    text: string,
    parser: Parser,
    dataFormat: DataTransferType,
    logger: Logger2.ILogger,
): boolean {
    const parsed = tryCatch(() => parser.parse(text));
    const html = dataFormat === DataTransferType.Html;
    if (!parsed.success) {
        globalLogger.error(parsed.error);
        logger.error(parsed.error, html ? {event: 'parse-html'} : {event: 'paste', dataFormat});
        console.error(parsed.error);
        return false;
    }
    const slice = getSliceFromMarkupFragment(parsed.result.content);
    if (!html) logger.event({event: 'paste-parsed-content', dataFormat});
    view.dispatch(
        trackTransactionMetrics(view.state.tr.replaceSelection(slice), 'paste', {
            clipboardDataFormat: dataFormat,
        }),
    );
    if (html) logger.event({event: 'paste-parsed-html'});
    return true;
}

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
    html?: string;
    markup?: string;
};
function serializeSelected(view: EditorView, serializer: Serializer): SerializeResult | null {
    const sel = view.state.selection;

    if (sel.empty) return null;

    // handle selection in codeblocks
    if (getSharedDepthNode(sel).type.spec.code) {
        const fragment = sel.content().content;
        return {text: fragment.textBetween(0, fragment.size)};
    }

    // FIXME: Verify and use Node instead of Fragment
    const markup = serializer.serialize(getCopyContent(view.state).content as any);
    const {dom, text} = view.serializeForClipboard(sel.content());
    return {markup, text, html: dom.innerHTML};
}

function setClipboardData(data: DataTransfer, result: SerializeResult) {
    data.clearData();
    if (typeof result.markup === 'string') data.setData(DataTransferType.Yfm, result.markup);
    if (typeof result.html === 'string') data.setData(DataTransferType.Html, result.html);
    data.setData(DataTransferType.Text, result.text);
}

function getCopyContent(state: EditorState): Slice {
    let sel = state.selection;

    if (isWholeSelection(sel)) {
        return new Slice(state.doc.content, 0, 0);
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
                    if (isListItemNode(node)) {
                        return new Slice(
                            Fragment.from(sel.$from.parent.copy(Fragment.from(node))),
                            0,
                            0,
                        );
                    }
                    return new Slice(Fragment.from(node.content), 1, 1);
                } else {
                    // TODO: handle copy of intermediate complex block node
                }
            }
        } else {
            return new Slice(Fragment.from(node), 1, 1);
        }
    }

    if (isTextSelection(sel)) {
        sel = trimTextSelection(sel);
    }

    if (isTextSelectionWithinSameTextBlock(sel)) {
        return new Slice(createFragmentFromInlineSelection(state, sel), 0, 0);
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
    } else {
        // trim empty list items
        const createEmptyParagraph = () => Fragment.from(pType(state.schema).createAndFill());
        const trimmedContent = trimContent(slice.content, createEmptyParagraph);
        if (trimmedContent !== slice.content) {
            slice = new Slice(trimmedContent, 1, 1);
        }
    }

    return slice;
}

function isTextSelectionWithinSameTextBlock(sel: Selection) {
    return isTextSelection(sel) && sel.$from.sameParent(sel.$to) && sel.$from.parent.isTextblock;
}

function createFragmentFromInlineSelection(state: EditorState, sel: Selection) {
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

function getSharedDepthNode({$from, $to}: {$from: ResolvedPos; $to: ResolvedPos}): Node {
    return $from.node($from.sharedDepth($to.pos));
}

import {autocompletion} from '@codemirror/autocomplete';
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
    insertNewlineKeepIndent,
    insertTab,
} from '@codemirror/commands';
import {syntaxHighlighting} from '@codemirror/language';
import type {Extension, StateCommand} from '@codemirror/state';
import {
    EditorView,
    type EditorViewConfig,
    type KeyBinding,
    keymap,
    placeholder,
} from '@codemirror/view';

import type {ParseInsertedUrlAsImage} from '../../bundle';
import type {EventMap} from '../../bundle/Editor';
import {ActionName} from '../../bundle/config/action-names';
import type {ReactRenderStorage} from '../../extensions';
import {type Logger2, globalLogger} from '../../logger';
import {Action as A, formatter as f} from '../../shortcuts';
import type {Receiver} from '../../utils';
import {DataTransferType, shouldSkipHtmlConversion} from '../../utils/clipboard';
import type {DirectiveSyntaxContext} from '../../utils/directive';
import {
    insertEmptyRow,
    insertImages,
    insertLink,
    toH1,
    toH2,
    toH3,
    toH4,
    toH5,
    toH6,
    toggleBold,
    toggleItalic,
    toggleStrikethrough,
    toggleUnderline,
    wrapToCodeBlock,
    wrapToInlineCode,
    wrapToYfmCut,
    wrapToYfmNote,
} from '../commands';

import {DirectiveSyntaxFacet} from './directive-facet';
import {type FileUploadHandler, FileUploadHandlerFacet} from './files-upload-facet';
import {gravityHighlightStyle, gravityTheme} from './gravity';
import {MarkdownConverter} from './html-to-markdown/converters';
import {LoggerFacet} from './logger-facet';
import {PairingCharactersExtension} from './pairing-chars';
import {ReactRendererFacet} from './react-facet';
import {SearchPanelPlugin} from './search-plugin/plugin';
import {smartReindent} from './smart-reindent';
import {type YfmLangOptions, yfmLang} from './yfm';

export type {YfmLangOptions};

type Autocompletion = Parameters<typeof autocompletion>[0];

const linkRegex = /\[[\s\S]*?]\([\s\S]*?\)/g;

export type CreateCodemirrorParams = {
    doc: EditorViewConfig['doc'];
    placeholder: Parameters<typeof placeholder>[0];
    logger: Logger2.ILogger;
    onCancel: () => void;
    onSubmit: () => void;
    onChange: () => void;
    onDocChange: () => void;
    onScroll: (event: Event) => void;
    reactRenderer: ReactRenderStorage;
    uploadHandler?: FileUploadHandler;
    parseHtmlOnPaste?: boolean;
    parseInsertedUrlAsImage?: ParseInsertedUrlAsImage;
    needImageDimensions?: boolean;
    enableNewImageSizeCalculation?: boolean;
    extensions?: Extension[];
    disabledExtensions?: {
        history?: boolean;
    };
    keymaps?: readonly KeyBinding[];
    receiver?: Receiver<EventMap>;
    yfmLangOptions?: YfmLangOptions;
    autocompletion?: Autocompletion;
    directiveSyntax: DirectiveSyntaxContext;
    preserveEmptyRows: boolean;
};

export function createCodemirror(params: CreateCodemirrorParams) {
    const {
        logger,
        doc,
        reactRenderer,
        onCancel,
        onScroll,
        onSubmit,
        onChange,
        onDocChange,
        disabledExtensions = {},
        keymaps = [],
        receiver,
        yfmLangOptions,
        extensions: extraExtensions,
        placeholder: placeholderContent,
        autocompletion: autocompletionConfig,
        parseHtmlOnPaste,
        parseInsertedUrlAsImage,
        directiveSyntax,
        preserveEmptyRows,
    } = params;

    const extensions: Extension[] = [gravityTheme, placeholder(placeholderContent)];

    if (!disabledExtensions.history) {
        extensions.push(history());
    }

    extensions.push(
        syntaxHighlighting(gravityHighlightStyle),
        LoggerFacet.of(logger),
        keymap.of([
            {key: f.toCM(A.Bold)!, run: withLogger(ActionName.bold, toggleBold)},
            {key: f.toCM(A.Italic)!, run: withLogger(ActionName.italic, toggleItalic)},
            {key: f.toCM(A.Strike)!, run: withLogger(ActionName.strike, toggleStrikethrough)},
            {key: f.toCM(A.Underline)!, run: withLogger(ActionName.underline, toggleUnderline)},
            {key: f.toCM(A.Link)!, run: withLogger(ActionName.link, insertLink)},
            {key: f.toCM(A.Heading1)!, run: withLogger(ActionName.heading1, toH1)},
            {key: f.toCM(A.Heading2)!, run: withLogger(ActionName.heading2, toH2)},
            {key: f.toCM(A.Heading3)!, run: withLogger(ActionName.heading3, toH3)},
            {key: f.toCM(A.Heading4)!, run: withLogger(ActionName.heading4, toH4)},
            {key: f.toCM(A.Heading5)!, run: withLogger(ActionName.heading5, toH5)},
            {key: f.toCM(A.Heading6)!, run: withLogger(ActionName.heading6, toH6)},
            {key: f.toCM(A.Code)!, run: withLogger(ActionName.code_inline, wrapToInlineCode)},
            {key: f.toCM(A.CodeBlock)!, run: withLogger(ActionName.code_block, wrapToCodeBlock)},
            {key: f.toCM(A.Cut)!, run: withLogger(ActionName.yfm_cut, wrapToYfmCut)},
            {key: f.toCM(A.Note)!, run: withLogger(ActionName.yfm_note, wrapToYfmNote)},
            {
                key: f.toCM(A.Cancel)!,
                preventDefault: true,
                run: () => {
                    onCancel();
                    return true;
                },
            },
            {
                key: f.toCM(A.Submit)!,
                preventDefault: true,
                run: () => {
                    onSubmit();
                    return true;
                },
            },
            {key: 'Tab', preventDefault: true, run: insertTab},
            {
                key: 'Enter',
                shift: insertNewlineKeepIndent,
            },
            indentWithTab,
            ...defaultKeymap,
            ...(disabledExtensions.history ? [] : historyKeymap),
            ...keymaps,
        ]),
        autocompletion(autocompletionConfig),
        yfmLang(yfmLangOptions),
        ReactRendererFacet.of(reactRenderer),
        DirectiveSyntaxFacet.of(directiveSyntax),
        PairingCharactersExtension,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({spellcheck: 'true'}),
        EditorView.domEventHandlers({
            scroll(event) {
                onScroll(event);
            },
            paste(event, editor) {
                if (!event.clipboardData) return;

                const pasteLogger = logger.nested({
                    domEvent: 'paste',
                    dataTypes: event.clipboardData.types,
                });

                const {from} = editor.state.selection.main;
                const line = editor.state.doc.lineAt(from);
                const currentLine = line.text;

                // if clipboard contains YFM content - avoid any meddling with pasted content
                // since text/yfm will contain valid markdown
                const yfmContent = event.clipboardData.getData(DataTransferType.Yfm);
                if (yfmContent) {
                    event.preventDefault();
                    logger.event({event: 'paste-markup'});
                    const reindentedYfmContent = smartReindent(yfmContent, currentLine);
                    editor.dispatch(editor.state.replaceSelection(reindentedYfmContent));
                    return;
                }

                // checking if a copy buffer content is suitable for convertion
                const shouldSkipHtml = shouldSkipHtmlConversion(event.clipboardData);

                // if we have text/html inside copy/paste buffer
                const htmlContent = event.clipboardData.getData(DataTransferType.Html);
                // if we pasting markdown from VsCode we need skip html transformation
                if (htmlContent && parseHtmlOnPaste && !shouldSkipHtml) {
                    let parsedMarkdownMarkup: string | undefined;
                    try {
                        const parser = new DOMParser();
                        const htmlDoc = parser.parseFromString(htmlContent, 'text/html');

                        const converter = new MarkdownConverter();
                        parsedMarkdownMarkup = converter.processNode(htmlDoc.body).trim();
                    } catch (e) {
                        // The code is pretty new and there might be random issues we haven't caught yet,
                        // especially with invalid HTML or weird DOM parsing errors.
                        // If something goes wrong, I just want to fall back to the "default pasting"
                        // rather than break the entire experience for the user.
                        pasteLogger.error(e, {event: 'parse-html-to-md'});
                        globalLogger.error(e);
                    }

                    if (parsedMarkdownMarkup !== undefined) {
                        event.preventDefault();
                        logger.event({event: 'paste-parsed-html'});
                        const reindentedHtmlContent = smartReindent(
                            parsedMarkdownMarkup,
                            currentLine,
                        );
                        editor.dispatch(editor.state.replaceSelection(reindentedHtmlContent));
                        return;
                    }
                }

                if (parseInsertedUrlAsImage) {
                    const linkMatches = currentLine.matchAll(linkRegex);
                    const isInsertedInsideLink = linkMatches.some(
                        (item) => from >= item.index && from <= item.index + (item[0]?.length ?? 0),
                    );
                    if (!isInsertedInsideLink) {
                        const {imageUrl, title} =
                            parseInsertedUrlAsImage(
                                event.clipboardData.getData(DataTransferType.Text) ?? '',
                            ) || {};

                        if (imageUrl) {
                            event.preventDefault();
                            logger.event({event: 'paste-url-as-image'});
                            insertImages([
                                {
                                    url: imageUrl,
                                    alt: title,
                                    title,
                                },
                            ])(editor);
                        }
                    }
                }

                // Reindenting pasted plain text
                const pastedText = event.clipboardData.getData(DataTransferType.Text);
                const reindentedText = smartReindent(pastedText, currentLine);
                // but only if there is a need for reindentation
                if (pastedText !== reindentedText) {
                    editor.dispatch(editor.state.replaceSelection(reindentedText));
                    event.preventDefault();
                }
            },
        }),
        SearchPanelPlugin({
            anchorSelector: '.g-md-search-anchor',
            receiver,
        }),
    );

    if (preserveEmptyRows) {
        extensions.push(
            keymap.of([
                {key: f.toCM(A.EmptyRow)!, run: withLogger(ActionName.emptyRow, insertEmptyRow)},
            ]),
        );
    }

    if (params.uploadHandler) {
        extensions.push(
            FileUploadHandlerFacet.of({
                fn: params.uploadHandler,
                imageWithDimensions: params.needImageDimensions,
                enableNewImageSizeCalculation: params.enableNewImageSizeCalculation,
            }),
        );
    }

    if (extraExtensions) {
        extensions.push(...extraExtensions);
    }

    return new EditorView({
        doc,
        extensions,
        dispatchTransactions: (trs, view) => {
            view.update(trs);
            onChange();
            if (trs.some((tr) => tr.docChanged)) {
                onDocChange();
            }
        },
    });
}

export function withLogger(action: string, command: StateCommand): StateCommand {
    return (...args) => {
        const {state} = args[0];
        state.facet(LoggerFacet).action({source: 'keymap', action});
        globalLogger.action({mode: 'markup', source: 'keymap', action});
        return command(...args);
    };
}

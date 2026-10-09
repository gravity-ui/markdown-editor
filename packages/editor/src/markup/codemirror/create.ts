import {autocompletion, completionKeymap} from '@codemirror/autocomplete';
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
    insertNewlineKeepIndent,
    insertTab,
} from '@codemirror/commands';
import {syntaxHighlighting} from '@codemirror/language';
import {type Extension, Prec, type StateCommand} from '@codemirror/state';
import {
    EditorView,
    type EditorViewConfig,
    type KeyBinding,
    keymap,
    placeholder,
    tooltips,
} from '@codemirror/view';

import {InputState} from 'src/utils/input-state';

import {ActionName} from '../../bundle/config/action-names';
import type {EventMap} from '../../bundle/events';
import type {ReactRenderStorage} from '../../extensions';
import {type Logger2, globalLogger} from '../../logger';
import {Action as A, formatter as f} from '../../shortcuts';
import type {Receiver} from '../../utils';
import {DataTransferType, shouldSkipHtmlConversion} from '../../utils/clipboard';
import type {DirectiveSyntaxContext} from '../../utils/directive';
import {isMac} from '../../utils/platform';
import type {ParseInsertedUrlAsImage} from '../../utils/upload';
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
import {FilesUploadPlugin} from './files-upload-plugin';
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
type Tooltips = Parameters<typeof tooltips>[0];

const linkRegex = /\[[\s\S]*?]\([\s\S]*?\)/g;

const isAltOrShift = (part: string) => part === 'Alt' || part === 'Shift';

// macOS types a character on Alt with a character key: Opt+A gives "Å", Opt+Shift+0 gives "`" on
// the Russian layout. Key resolution for Alt combinations there goes by key code, so a binding on
// such a combination shadows the input. Alt with a named key (Alt-ArrowUp) types nothing.
const typesCharacterOnMac = ({mac, key}: KeyBinding): boolean => {
    const parts = (mac ?? key ?? '').split('-');
    const char = parts.pop() ?? '';
    return char.length === 1 && parts.includes('Alt') && parts.every(isAltOrShift);
};

// Both commands dropped this way stay reachable: toggleBlockComment by Mod-/, since markdown has
// no line comment syntax and toggleComment falls back to block comments, startCompletion by
// Ctrl-Space.
const withoutMacAltCharacters = (bindings: readonly KeyBinding[]): readonly KeyBinding[] =>
    isMac() ? bindings.filter((binding) => !typesCharacterOnMac(binding)) : bindings;

const bind = (action: A, binding: Omit<KeyBinding, 'key'>): KeyBinding[] =>
    f.toCMList(action).map((key) => ({...binding, key}));

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
    tooltips?: Tooltips;
    directiveSyntax: DirectiveSyntaxContext;
    preserveEmptyRows: boolean;
    searchPanel?: boolean;
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
        tooltips: tooltipsConfig,
        parseHtmlOnPaste,
        parseInsertedUrlAsImage,
        directiveSyntax,
        preserveEmptyRows,
        searchPanel = true,
    } = params;

    const extensions: Extension[] = [gravityTheme, placeholder(placeholderContent)];

    if (!disabledExtensions.history) {
        extensions.push(history());
    }

    const inputState = new InputState();

    extensions.push(
        syntaxHighlighting(gravityHighlightStyle),
        LoggerFacet.of(logger),
        keymap.of([
            ...bind(A.Bold, {run: withLogger(ActionName.bold, toggleBold)}),
            ...bind(A.Italic, {run: withLogger(ActionName.italic, toggleItalic)}),
            ...bind(A.Strike, {run: withLogger(ActionName.strike, toggleStrikethrough)}),
            ...bind(A.Underline, {run: withLogger(ActionName.underline, toggleUnderline)}),
            ...bind(A.Link, {run: withLogger(ActionName.link, insertLink)}),
            ...bind(A.Heading1, {run: withLogger(ActionName.heading1, toH1)}),
            ...bind(A.Heading2, {run: withLogger(ActionName.heading2, toH2)}),
            ...bind(A.Heading3, {run: withLogger(ActionName.heading3, toH3)}),
            ...bind(A.Heading4, {run: withLogger(ActionName.heading4, toH4)}),
            ...bind(A.Heading5, {run: withLogger(ActionName.heading5, toH5)}),
            ...bind(A.Heading6, {run: withLogger(ActionName.heading6, toH6)}),
            ...bind(A.Code, {run: withLogger(ActionName.code_inline, wrapToInlineCode)}),
            ...bind(A.CodeBlock, {run: withLogger(ActionName.code_block, wrapToCodeBlock)}),
            ...bind(A.Cut, {run: withLogger(ActionName.yfm_cut, wrapToYfmCut)}),
            ...bind(A.Note, {run: withLogger(ActionName.yfm_note, wrapToYfmNote)}),
            ...bind(A.Cancel, {
                preventDefault: true,
                run: () => {
                    onCancel();
                    return true;
                },
            }),
            ...bind(A.Submit, {
                preventDefault: true,
                run: () => {
                    onSubmit();
                    return true;
                },
            }),
            {key: 'Tab', preventDefault: true, run: insertTab},
            {
                key: 'Enter',
                shift: insertNewlineKeepIndent,
            },
            indentWithTab,
            ...withoutMacAltCharacters(defaultKeymap),
            ...(disabledExtensions.history ? [] : historyKeymap),
            ...keymaps,
        ]),
        autocompletion({...autocompletionConfig, defaultKeymap: false}),
        autocompletionConfig?.defaultKeymap === false
            ? []
            : Prec.highest(keymap.of(withoutMacAltCharacters(completionKeymap))),
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
            keydown(event) {
                inputState.keydown(event);
            },
            keyup(event) {
                inputState.keyup(event);
            },
            paste(event, editor) {
                if (!event.clipboardData) return false;

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
                    return true;
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
                        return true;
                    }
                }

                if (!inputState.shiftKey && parseInsertedUrlAsImage) {
                    const linkMatches = currentLine.matchAll(linkRegex);
                    const cursorPositionInCurrentLine = from - line.from;
                    const isInsertedInsideLink = linkMatches.some(
                        (item) =>
                            cursorPositionInCurrentLine >= item.index &&
                            cursorPositionInCurrentLine <= item.index + (item[0]?.length ?? 0),
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
                            return true;
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
                    return true;
                }

                return false;
            },
        }),
    );

    if (searchPanel) {
        extensions.push(
            SearchPanelPlugin({
                anchorSelector: '.g-md-search-markup-anchor',
                editorSelector: '.g-md-editor-component',
                receiver,
            }),
        );
    }

    if (preserveEmptyRows) {
        extensions.push(
            keymap.of(bind(A.EmptyRow, {run: withLogger(ActionName.emptyRow, insertEmptyRow)})),
        );
    }

    if (params.uploadHandler) {
        extensions.push(FilesUploadPlugin.extension);
        extensions.push(
            FileUploadHandlerFacet.of({
                fn: params.uploadHandler,
                imageWithDimensions: params.needImageDimensions,
                enableNewImageSizeCalculation: params.enableNewImageSizeCalculation,
            }),
        );
    }

    if (tooltipsConfig) {
        extensions.push(tooltips(tooltipsConfig));
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

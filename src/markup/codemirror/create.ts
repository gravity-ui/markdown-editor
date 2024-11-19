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
import {EditorView, EditorViewConfig, KeyBinding, keymap, placeholder} from '@codemirror/view';

import type {ParseInsertedUrlAsImage} from '../../bundle';
import {EventMap} from '../../bundle/Editor';
import {ActionName} from '../../bundle/config/action-names';
import {ReactRenderStorage} from '../../extensions';
import {DataTransferType} from '../../extensions/behavior/Clipboard/utils';
import {logger} from '../../logger';
import {Action as A, formatter as f} from '../../shortcuts';
import {Receiver} from '../../utils';
import {
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

import {FileUploadHandler, FileUploadHandlerFacet} from './files-upload-facet';
import {gravityHighlightStyle, gravityTheme} from './gravity';
import {PairingCharactersExtension} from './pairing-chars';
import {handleMarkdownPaste} from './paste-handler';
import {ReactRendererFacet} from './react-facet';
import {SearchPanelPlugin} from './search-plugin/plugin';
import {type YfmLangOptions, yfmLang} from './yfm';

export type {YfmLangOptions};

type Autocompletion = Parameters<typeof autocompletion>[0];

export type CreateCodemirrorParams = {
    doc: EditorViewConfig['doc'];
    placeholder: Parameters<typeof placeholder>[0];
    onCancel: () => void;
    onSubmit: () => void;
    onChange: () => void;
    onDocChange: () => void;
    onScroll: (event: Event) => void;
    reactRenderer: ReactRenderStorage;
    uploadHandler?: FileUploadHandler;
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
};

export function createCodemirror(params: CreateCodemirrorParams) {
    const {
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
        parseInsertedUrlAsImage,
    } = params;

    const extensions: Extension[] = [gravityTheme, placeholder(placeholderContent)];

    if (!disabledExtensions.history) {
        extensions.push(history());
    }

    extensions.push(
        syntaxHighlighting(gravityHighlightStyle),
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
        PairingCharactersExtension,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({spellcheck: 'true'}),
        EditorView.domEventHandlers({
            scroll(event) {
                onScroll(event);
            },
            paste(event, editor) {
                if (!event.clipboardData) return false;

                const pastedText = event.clipboardData.getData('text/plain');

                // Handle markdown-aware pasting
                if (handleMarkdownPaste(pastedText, editor)) {
                    event.preventDefault();
                    return true;
                }

                // Handle image URL pasting
                if (parseInsertedUrlAsImage) {
                    const {imageUrl, title} =
                        parseInsertedUrlAsImage(
                            event.clipboardData.getData(DataTransferType.Text) ?? '',
                        ) || {};

                    if (!imageUrl) {
                        return;
                    }

                    event.preventDefault();

                    insertImages([
                        {
                            url: imageUrl,
                            alt: title,
                            title,
                        },
                    ])(editor);

                    return true;
                }

                return true;
            },
        }),
        SearchPanelPlugin({
            anchorSelector: '.g-md-search-anchor',
            receiver,
        }),
    );

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
        logger.action({mode: 'markup', source: 'keymap', action});
        return command(...args);
    };
}

import {autocompletion} from '@codemirror/autocomplete';
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
    insertTab,
} from '@codemirror/commands';
import {syntaxHighlighting} from '@codemirror/language';
import type {Extension, StateCommand} from '@codemirror/state';
import {EditorView, EditorViewConfig, keymap, placeholder} from '@codemirror/view';

import {EventMap} from '../../bundle/Editor';
import {ActionName} from '../../bundle/config/action-names';
import {ReactRenderStorage} from '../../extensions';
import {logger} from '../../logger';
import {Action as A, formatter as f} from '../../shortcuts';
import {Receiver} from '../../utils';
import {
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
import {ReactRendererFacet} from './react-facet';
import {SearchPanelPlugin} from './search-plugin/plugin';
import {yfmLang} from './yfm';

export type CreateCodemirrorParams = {
    doc: EditorViewConfig['doc'];
    placeholderText: string;
    onCancel: () => void;
    onSubmit: () => void;
    onChange: () => void;
    onDocChange: () => void;
    onScroll: (event: Event) => void;
    reactRenderer: ReactRenderStorage;
    uploadHandler?: FileUploadHandler;
    needImgDimms?: boolean;
    extraMarkupExtensions?: Extension[];
    receiver?: Receiver<EventMap>;
};

export function createCodemirror(params: CreateCodemirrorParams) {
    const {
        doc,
        placeholderText,
        reactRenderer,
        onCancel,
        onScroll,
        onSubmit,
        onChange,
        onDocChange,
        extraMarkupExtensions,
        receiver,
    } = params;

    const extensions: Extension[] = [
        gravityTheme,
        placeholder(placeholderText),
        history(),
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
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
        ]),
        autocompletion(),
        yfmLang(),
        ReactRendererFacet.of(reactRenderer),
        PairingCharactersExtension,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({spellcheck: 'true'}),
        EditorView.domEventHandlers({
            scroll(event) {
                onScroll(event);
            },
        }),
        SearchPanelPlugin({
            anchorSelector: '.g-md-search-anchor',
            receiver,
        }),
    ];
    if (params.uploadHandler) {
        extensions.push(
            FileUploadHandlerFacet.of({
                fn: params.uploadHandler,
                imgWithDimms: params.needImgDimms,
            }),
        );
    }
    if (extraMarkupExtensions) {
        extensions.push(...extraMarkupExtensions);
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

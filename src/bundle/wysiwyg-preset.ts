import {Node} from 'prosemirror-model';

import type {ExtensionAuto} from '../core';
import {BehaviorPreset, BehaviorPresetOptions} from '../extensions/behavior';
import {EditorModeKeymap, EditorModeKeymapOptions} from '../extensions/behavior/EditorModeKeymap';
import {BaseNode, YfmHeadingAttr, YfmNoteNode} from '../extensions/specs';
import {i18n as i18nPlaceholder} from '../i18n/placeholder';
import {CommonMarkPreset, CommonMarkPresetOptions} from '../presets/commonmark';
import {DefaultPreset, DefaultPresetOptions} from '../presets/default';
import {FullPreset, FullPresetOptions} from '../presets/full';
import {YfmPreset, YfmPresetOptions} from '../presets/yfm';
import {ZeroPreset, ZeroPresetOptions} from '../presets/zero';
import {Action as A, formatter as f} from '../shortcuts';
import type {DirectiveSyntaxContext} from '../utils/directive';
import type {FileUploadHandler} from '../utils/upload';

import {wCommandMenuConfigByPreset, wSelectionMenuConfigByPreset} from './config/wysiwyg';
import {emojiDefs} from './emoji';
import type {MarkdownEditorPreset, WysiwygPlaceholderOptions} from './types';

const DEFAULT_IGNORED_KEYS = ['Tab', 'Shift-Tab'] as const;

export type ExtensionsOptions = BehaviorPresetOptions & FullPresetOptions;

export type BundlePresetOptions = ExtensionsOptions &
    EditorModeKeymapOptions & {
        preset: MarkdownEditorPreset;
        mdBreaks?: boolean;
        preserveEmptyRows?: boolean;
        fileUploadHandler?: FileUploadHandler;
        placeholderOptions?: WysiwygPlaceholderOptions;
        /**
         * If we need to set dimensions for uploaded images
         *
         * @default false
         */
        needToSetDimensionsForUploadedImages?: boolean;
        enableNewImageSizeCalculation?: boolean;
        directiveSyntax: DirectiveSyntaxContext;
    };

declare global {
    namespace WysiwygEditor {
        interface Context {
            directiveSyntax: DirectiveSyntaxContext;
        }
    }
}

export const BundlePreset: ExtensionAuto<BundlePresetOptions> = (builder, opts) => {
    builder.context.set('directiveSyntax', opts.directiveSyntax);

    const dropCursor: NonNullable<BundlePresetOptions['cursor']>['dropOptions'] = {
        color: 'var(--g-color-line-brand)',
        width: 2,
    };

    const zeroOptions: BehaviorPresetOptions & ZeroPresetOptions = {
        ...opts,
        baseStyles: {
            attributes: {
                // for disable setting attrs inside pm-view from floating-ui from uikit
                // see https://github.com/floating-ui/floating-ui/discussions/3213
                // and https://github.com/floating-ui/floating-ui/pull/3202
                'aria-live': '',
                ...opts.baseStyles?.attributes,
            },
        },
        cursor: {dropOptions: dropCursor},
        clipboard: {pasteFileHandler: opts.fileUploadHandler, ...opts.clipboard},
        selectionContext: {config: wSelectionMenuConfigByPreset.zero, ...opts.selectionContext},
        commandMenu: {actions: wCommandMenuConfigByPreset.zero, ...opts.commandMenu},
        history: {undoKey: f.toPM(A.Undo), redoKey: f.toPM(A.Redo), ...opts.history},
        baseSchema: {
            paragraphKey: f.toPM(A.Text),
            paragraphPlaceholder: (node: Node, parent?: Node | null) => {
                const {value, behavior} = opts.placeholderOptions || {};

                const emptyEntries = {
                    'empty-row': !node.text,
                    'empty-row-top-level': !node.text && parent?.type.name === BaseNode.Doc,
                    'empty-doc':
                        !node.text && parent?.type.name === BaseNode.Doc && parent.childCount === 1,
                };

                const showPlaceholder = emptyEntries[behavior || 'empty-doc'];

                if (!showPlaceholder) return null;

                return typeof value === 'function'
                    ? value()
                    : value ?? i18nPlaceholder('doc_empty');
            },
            preserveEmptyRows: opts.preserveEmptyRows,
            ...opts.baseSchema,
        },
    };
    const commonMarkOptions: BehaviorPresetOptions & CommonMarkPresetOptions = {
        ...zeroOptions,
        selectionContext: {
            config: wSelectionMenuConfigByPreset.commonmark,
            ...opts.selectionContext,
        },
        commandMenu: {actions: wCommandMenuConfigByPreset.commonmark, ...opts.commandMenu},
        breaks: {
            preferredBreak: (opts.mdBreaks ? 'soft' : 'hard') as 'soft' | 'hard',
            ...opts.breaks,
        },
        bold: {boldKey: f.toPM(A.Bold), ...opts.bold},
        italic: {italicKey: f.toPM(A.Italic), ...opts.italic},
        code: {codeKey: f.toPM(A.Code), ...opts.code},
        codeBlock: {
            codeBlockKey: f.toPM(A.CodeBlock),
            ...opts.codeBlock,
        },
        blockquote: {qouteKey: f.toPM(A.Quote), ...opts.blockquote},
        link: {linkKey: f.toPM(A.Link), ...opts.link},
        lists: {
            ulKey: f.toPM(A.BulletList),
            olKey: f.toPM(A.OrderedList),
            ulInputRules: {plus: false},
            ...opts.lists,
        },
        image: {
            parseInsertedUrlAsImage: opts.imgSize?.parseInsertedUrlAsImage,
        },
    };
    const defaultOptions: BehaviorPresetOptions & DefaultPresetOptions = {
        ...commonMarkOptions,
        selectionContext: {config: wSelectionMenuConfigByPreset.default, ...opts.selectionContext},
        commandMenu: {actions: wCommandMenuConfigByPreset.default, ...opts.commandMenu},
        strike: {strikeKey: f.toPM(A.Strike), ...opts.strike},
    };
    const yfmOptions: BehaviorPresetOptions & YfmPresetOptions = {
        ...defaultOptions,
        selectionContext: {config: wSelectionMenuConfigByPreset.yfm, ...opts.selectionContext},
        commandMenu: {actions: wCommandMenuConfigByPreset.yfm, ...opts.commandMenu},
        underline: {underlineKey: f.toPM(A.Underline), ...opts.underline},
        imgSize: {
            imageUploadHandler: opts.fileUploadHandler,
            needToSetDimensionsForUploadedImages: opts.needToSetDimensionsForUploadedImages,
            enableNewImageSizeCalculation: opts.enableNewImageSizeCalculation,
            ...opts.imgSize,
        },
        checkbox: {checkboxLabelPlaceholder: () => i18nPlaceholder('checkbox'), ...opts.checkbox},
        deflist: {
            deflistTermPlaceholder: () => i18nPlaceholder('deflist_term'),
            deflistDescPlaceholder: () => i18nPlaceholder('deflist_desc'),
        },
        yfmCut: {
            yfmCutKey: f.toPM(A.Cut),
            yfmCutTitlePlaceholder: () => i18nPlaceholder('cut_title'),
            yfmCutContentPlaceholder: () => i18nPlaceholder('cut_content'),
            ...opts.yfmCut,
        },
        yfmNote: {
            yfmNoteKey: f.toPM(A.Note),
            yfmNoteTitlePlaceholder: () => i18nPlaceholder('note_title'),
            ...opts.yfmNote,
        },
        yfmTable: {yfmTableCellPlaceholder: () => i18nPlaceholder('table_cell'), ...opts.yfmTable},
        yfmFile: {
            fileUploadHandler: opts.fileUploadHandler,
            needToSetDimensionsForUploadedImages: opts.needToSetDimensionsForUploadedImages,
            ...opts.yfmFile,
        },
        yfmHeading: {
            h1Key: f.toPM(A.Heading1),
            h2Key: f.toPM(A.Heading2),
            h3Key: f.toPM(A.Heading3),
            h4Key: f.toPM(A.Heading4),
            h5Key: f.toPM(A.Heading5),
            h6Key: f.toPM(A.Heading6),
            headingPlaceholder: (node: Node) =>
                `${i18nPlaceholder('heading')} ${node.attrs[YfmHeadingAttr.Level]}`, // todo: remove attrs import
            ...opts.yfmHeading,
        },
        placeholder: {
            [YfmNoteNode.NoteContent]: () => i18nPlaceholder('note_content'),
        },
    };
    const fullOptions: BehaviorPresetOptions & FullPresetOptions = {
        ...yfmOptions,
        selectionContext: {config: wSelectionMenuConfigByPreset.full, ...opts.selectionContext},
        commandMenu: {actions: wCommandMenuConfigByPreset.full, ...opts.commandMenu},
        emoji: {defs: emojiDefs, ...opts.emoji},
    };

    const zeroIgnoreActions = [A.Undo, A.Redo];
    const commonMarkIgnoreActions = zeroIgnoreActions.concat(
        A.Bold,
        A.Italic,
        A.Code,
        A.Link,

        A.Text,
        A.Heading1,
        A.Heading2,
        A.Heading3,
        A.Heading4,
        A.Heading5,
        A.Heading6,

        A.BulletList,
        A.OrderedList,

        A.Quote,
        A.CodeBlock,
    );
    const defaultIgnoreActions = commonMarkIgnoreActions.concat(A.Strike);
    const yfmIgnoreActions = defaultIgnoreActions.concat(
        A.Underline,

        A.Note,
        A.Cut,
    );
    const fullIgnoreActions = yfmIgnoreActions.concat();

    let ignoreActions;

    switch (opts.preset) {
        case 'zero': {
            ignoreActions = zeroIgnoreActions;
            builder.use(BehaviorPreset, zeroOptions).use(ZeroPreset, zeroOptions);
            break;
        }
        case 'commonmark': {
            ignoreActions = commonMarkIgnoreActions;
            builder.use(BehaviorPreset, commonMarkOptions).use(CommonMarkPreset, commonMarkOptions);
            break;
        }
        case 'default': {
            ignoreActions = defaultIgnoreActions;
            builder.use(BehaviorPreset, defaultOptions).use(DefaultPreset, defaultOptions);
            break;
        }
        case 'yfm': {
            ignoreActions = yfmIgnoreActions;
            builder.use(BehaviorPreset, yfmOptions).use(YfmPreset, yfmOptions);
            break;
        }
        default: {
            ignoreActions = fullIgnoreActions;
            builder.use(BehaviorPreset, fullOptions).use(FullPreset, fullOptions);
            break;
        }
    }

    const ignoreKeysList = opts.ignoreKeysList?.slice() ?? [];
    ignoreKeysList.push(...DEFAULT_IGNORED_KEYS);
    for (const action of ignoreActions) {
        const key = f.toPM(action);
        if (key) ignoreKeysList.push(key);
    }

    builder.use(EditorModeKeymap, {
        onSubmit: opts.onSubmit,
        onCancel: opts.onCancel,
        ignoreKeysList,
    });
};

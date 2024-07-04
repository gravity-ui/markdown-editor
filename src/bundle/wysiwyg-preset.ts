import {Node} from 'prosemirror-model';

import {ExtensionAuto} from '../core';
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
import type {FileUploadHandler} from '../utils/upload';

import {EditorPreset} from './Editor';
import {wCommandMenuConfigByPreset, wSelectionMenuConfigByPreset} from './config/wysiwyg';
import {emojiDefs} from './emoji';

const DEFAULT_IGNORED_KEYS = ['Tab', 'Shift-Tab'] as const;

export type ExtensionsOptions = BehaviorPresetOptions & FullPresetOptions;

export type BundlePresetOptions = ExtensionsOptions &
    EditorModeKeymapOptions & {
        preset: EditorPreset;
        mdBreaks?: boolean;
        fileUploadHandler?: FileUploadHandler;
        /**
         * If we need to set dimensions for uploaded images
         *
         * @default false
         */
        needToSetDimensionsForUploadedImages?: boolean;
    };

export const BundlePreset: ExtensionAuto<BundlePresetOptions> = (builder, opts) => {
    const dropCursor: NonNullable<BundlePresetOptions['cursor']>['dropOptions'] = {
        color: 'var(--g-color-line-brand)',
        width: 2,
    };

    const zeroOptions: BehaviorPresetOptions & ZeroPresetOptions = {
        ...opts,
        cursor: {dropOptions: dropCursor},
        clipboard: {pasteFileHandler: opts.fileUploadHandler, ...opts.clipboard},
        selectionContext: {config: wSelectionMenuConfigByPreset.zero, ...opts.selectionContext},
        commandMenu: {actions: wCommandMenuConfigByPreset.zero, ...opts.commandMenu},
        history: {undoKey: f.toPM(A.Undo), redoKey: f.toPM(A.Redo), ...opts.history},
        baseSchema: {
            paragraphKey: f.toPM(A.Text),
            paragraphPlaceholder: (node: Node, parent?: Node | null) => {
                const isDocEmpty =
                    !node.text && parent?.type.name === BaseNode.Doc && parent.childCount === 1;
                return isDocEmpty ? i18nPlaceholder('doc_empty') : null;
            },
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
        yfmHtml: {
            loadRuntimeScript: () => {
                import(
                    /* webpackChunkName: "yfm-html-runtime" */ '@diplodoc/html-extension/runtime'
                );
            },
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

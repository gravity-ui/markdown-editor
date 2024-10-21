// public types, re-exported in src/bundle/index.ts

import type {ReactNode} from 'react';

import type {MarkupString} from '../common';
import type {EscapeConfig, Extension} from '../core';
import type {CreateCodemirrorParams, YfmLangOptions} from '../markup/codemirror';
import type {FileUploadHandler} from '../utils/upload';

import type {ChangeEditorModeOptions} from './Editor';
import type {ExtensionsOptions as WysiwygPresetExtensionsOptions} from './wysiwyg-preset';

export type {Editor as MarkdownEditorInstance} from './Editor';
export type MarkdownEditorMode = 'wysiwyg' | 'markup';
export type MarkdownEditorPreset = 'zero' | 'commonmark' | 'default' | 'yfm' | 'full';
export type MarkdownEditorSplitMode = false | 'horizontal' | 'vertical';

export type RenderPreviewParams = {
    getValue: () => MarkupString;
    mode: 'preview' | 'split';
    md: Readonly<MarkdownEditorMdOptions>;
};
export type RenderPreview = (params: RenderPreviewParams) => ReactNode;

export type MarkdownEditorMdOptions = {
    html?: boolean;
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
};

export type MarkdownEditorInitialOptions = {
    markup?: MarkupString;
    /** Default – wysiwyg */
    mode?: MarkdownEditorMode;
    /** Default – true */
    toolbarVisible?: boolean;
    /**
     * Default – false
     *
     * Note: has no effect if `MarkdownEditorMarkupConfig.splitMode` is set to false or is not set.
     */
    splitModeEnabled?: boolean;
};

export type MarkdownEditorHandlers = {
    /** Pass this handler to allow uploading files from device. */
    uploadFile?: FileUploadHandler;
};

export type MarkdownEditorExperimentalOptions = {
    /**
     * If we need to set dimensions for uploaded images
     *
     * @default false
     */
    needToSetDimensionsForUploadedImages?: boolean;
    /**
     * Called before switching from the markup editor to the wysiwyg editor.
     * You can use it to pre-process the value from the markup editor before it gets into the wysiwyg editor.
     */
    prepareRawMarkup?: (value: MarkupString) => MarkupString;
    beforeEditorModeChange?: (
        options: Pick<ChangeEditorModeOptions, 'mode' | 'reason'>,
    ) => boolean | undefined;
};

export type MarkdownEditorMarkupConfig = {
    /**
     * Pass the rendering function to preview the markdown content.
     *
     * It is also used for split view rendering.
     *
     * If false is passed, preview will be disabled.
     */
    renderPreview?: RenderPreview;
    /**
     * Pass position of split view.
     *
     * Note: for enable split view, you need to pass renderPreview function too.
     *
     * If false is passed, split view will be disabled.
     */
    splitMode?: MarkdownEditorSplitMode;
    /** Additional extensions for codemirror instance. */
    extensions?: CreateCodemirrorParams['extensions'];
    /** Can be used to disable some of the default extensions */
    disabledExtensions?: CreateCodemirrorParams['disabledExtensions'];
    /** Additional keymaps for codemirror instance */
    keymaps?: CreateCodemirrorParams['keymaps'];
    /** Overrides the default placeholder content. */
    placeholder?: CreateCodemirrorParams['placeholder'];
    /**
     * Additional language data for markdown language in codemirror.
     * Can be used to configure additional autocompletions and others.
     * See more https://codemirror.net/docs/ref/#state.EditorState.languageDataAt
     */
    languageData?: YfmLangOptions['languageData'];
    /** Config for @codemirror/autocomplete https://codemirror.net/docs/ref/#autocomplete.autocompletion%5Econfig */
    autocompletion?: CreateCodemirrorParams['autocompletion'];
};

// do not export this type
type ExtensionsOptions<T extends object = {}> = Omit<
    WysiwygPresetExtensionsOptions,
    'reactRenderer'
> &
    T;

export type MarkdownEditorWysiwygConfig = {
    /** Additional extensions */
    extensions?: Extension;
    extensionOptions?: ExtensionsOptions;
    escapeConfig?: EscapeConfig;
};

// [major] TODO: remove generic type
export type MarkdownEditorOptions<T extends object = {}> = {
    /**
     * A set of plug-in extensions.
     *
     * @default 'full'
     */
    preset?: MarkdownEditorPreset;
    /** Markdown parser options */
    md?: MarkdownEditorMdOptions;
    /** Initial values */
    initial?: MarkdownEditorInitialOptions;
    handlers?: MarkdownEditorHandlers;
    experimental?: MarkdownEditorExperimentalOptions;
    /** Options for markup mode */
    markupConfig?: MarkdownEditorMarkupConfig;
    /** Options for wysiwyg mode */
    wysiwygConfig?: MarkdownEditorWysiwygConfig;

    /** @deprecated Put allowHTML via MarkdownEditorMdOptions */
    allowHTML?: boolean;
    /** @deprecated Put breaks via MarkdownEditorMdOptions */
    breaks?: boolean;
    /** @deprecated Put linkify via MarkdownEditorMdOptions */
    linkify?: boolean;
    /** @deprecated Put linkifyTlds via MarkdownEditorMdOptions */
    linkifyTlds?: string | string[];
    /** @deprecated Put initial markup via MarkdownEditorInitialOptions */
    initialMarkup?: MarkdownEditorInitialOptions['markup'];
    /**
     * @default 'wysiwyg'
     *
     * @deprecated Put initial editor mode via MarkdownEditorInitialOptions
     */
    initialEditorMode?: MarkdownEditorInitialOptions['mode'];
    /**
     * @default true
     *
     * @deprecated Put initial toolbar visibility via MarkdownEditorInitialOptions
     */
    initialToolbarVisible?: MarkdownEditorInitialOptions['toolbarVisible'];
    /**
     * Has no effect if splitMode is false or undefined
     *
     * @default false
     *
     * @deprecated Put initialSplitModeEnabled via MarkdownEditorInitialOptions
     */
    initialSplitModeEnabled?: MarkdownEditorInitialOptions['splitModeEnabled'];
    /**
     * If we need to set dimensions for uploaded images
     *
     * @default false
     *
     * @deprecated Put needToSetDimensionsForUploadedImages via MarkdownEditorExperimentalOptions
     */
    needToSetDimensionsForUploadedImages?: MarkdownEditorExperimentalOptions['needToSetDimensionsForUploadedImages'];
    /**
     * Called before switching from the markup editor to the wysiwyg editor.
     * You can use it to pre-process the value from the markup editor before it gets into the wysiwyg editor.
     *
     * @deprecated Put prepareRawMarkup via MarkdownEditorExperimentalOptions
     */
    prepareRawMarkup?: MarkdownEditorExperimentalOptions['prepareRawMarkup'];
    /** @deprecated Put beforeEditorModeChange via MarkdownEditorExperimentalOptions */
    experimental_beforeEditorModeChange?: MarkdownEditorExperimentalOptions['beforeEditorModeChange'];
    /** @deprecated Put split mode via MarkdownEditorMarkupConfig */
    splitMode?: MarkdownEditorMarkupConfig['splitMode'];
    /** @deprecated Put render preview function via MarkdownEditorMarkupConfig */
    renderPreview?: MarkdownEditorMarkupConfig['renderPreview'];
    /** @deprecated Put extensions via MarkdownEditorWysiwygConfig */
    extraExtensions?: MarkdownEditorWysiwygConfig['extensions'];
    /** @deprecated Put extension options via MarkdownEditorWysiwygConfig */
    extensionOptions?: ExtensionsOptions<T>;
    /** @deprecated Put extra extensions via MarkdownEditorMarkupConfig */
    extraMarkupExtensions?: MarkdownEditorMarkupConfig['extensions'];
    /** @deprecated Put escapeConfig via MarkdownEditorWysiwygConfig */
    escapeConfig?: MarkdownEditorWysiwygConfig['escapeConfig'];
    /** @deprecated Put file upload handler via MarkdownEditorHandlers */
    fileUploadHandler?: MarkdownEditorHandlers['uploadFile'];
};

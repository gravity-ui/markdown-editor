import React from 'react';

import {ClassNameProps} from '../classname';
import {MarkupString} from '../common';
import {Extension} from '../core';

import type {Editor, RenderPreview, SplitMode, EditorType as YfmEditorType} from './Editor';
import {YfmEditorView, YfmEditorViewProps} from './YfmEditorView';
import type {MToolbarData} from './config/markup';
import type {WToolbarData} from './config/wysiwyg';
import {UseYfmEditorProps, useYfmEditor} from './useYfmEditor';

export type {ExtensionsOptions} from './wysiwyg-preset';
export type {EditorType as YfmEditorType} from './Editor';

/**
 * @deprecated
 * The `YfmEditor` component will be removed soon.
 * Use `useYfmEditor` hook and `YfmEditorView` component instead.
 */
export type YfmEditorRef = Editor & {
    domElem: () => HTMLElement | null;
};

/**
 * @deprecated
 * The `YfmEditor` component will be removed soon.
 * Use `useYfmEditor` hook and `YfmEditorView` component instead.
 */
export type YfmEditorProps<T extends object = {}> = ClassNameProps &
    Pick<
        YfmEditorViewProps,
        'settingsVisible' | 'toaster' | 'wysiwygHiddenActionsConfig' | 'markupHiddenActionsConfig'
    > & {
        /** @default false'
         * Split mode orientation
         * Has no effect if renderPreview is not defined
         */
        splitMode?: SplitMode;
        /** @default true
         *  Is toolbar sticky
         */
        stickyToolbar?: boolean;
        autofocus?: boolean;
        /** initial yfm markup
         * Used only on first render
         */
        initialContent?: MarkupString;
        /** @default 'wysiwyg'
         * Used only on first render
         */
        initialEditorType?: YfmEditorType;
        /** @default true
         * Used only on first render
         */
        initialMenuVisible?: boolean;
        /** @default false
         * Used only on first render
         */
        initialSplitModeEnabled?: boolean;

        /** menu bar config for markup editor */
        markupMenubarData?: MToolbarData;
        /** menu bar config for wysiwyg editor */
        wysiwygMenubarData?: WToolbarData;
        /** Used only first value. Сhanging the value will not lead to anything */
        wysiwygExtraExtensions?: Extension;
        /** allowing HTML in markup */
        wysiwygAllowHTML?: boolean;
        /** markdown-it-attrs options */
        wysiwygAttrs?: UseYfmEditorProps['attrs'];
        /** allowing autoconvert URL-like text to links */
        wysiwygLinkify?: boolean;
        wysiwygLinkifyTlds?: string | string[];
        /**
         * Sets a soft break preferred for breaks inside a paragraph.
         *
         * If you set the "breaks:true" option for yfm-transform or markdrown-it,
         * set this param to "true" too, and the editor will add soft break
         * (a break without backslash) for breaks in the paragraph.
         *
         * Default: "true" – like in yfm-transform
         */
        wysiwygBreaks?: boolean;

        /** callback to action in menubar */
        onMenuBarAction?(data: {action: string; editorType: YfmEditorType}): void;
        /** callback on change split mode */
        onSplitModeEnabledChange?(splitModeEnabled: boolean): void;
        /** function that will transform raw markup to html */
        renderPreview?: RenderPreview;
        /** callback on change editor type */
        onEditorTypeChange?(newType: YfmEditorType): void;
        /** callback on change menubar visibility */
        onMenuVisibleChange?(visible: boolean): void;
        /** callback on editors content change */
        onMarkupChange?(editor: YfmEditorRef, editorType: YfmEditorType): void;
        /**
         * Called before switching from the markup editor to the wysiwyg editor.
         * You can use it to pre-process the value from the markup editor before it gets into the wysiwyg editor.
         */
        prepareRawMarkup?(value: string): string;

        /** Submit handler. Return true to stop propagation. */
        onSubmit?(editor: YfmEditorRef): boolean;
        /** Cancel handler. Return true to stop propagation. */
        onCancel?(editor: YfmEditorRef): boolean;

        onFileUpload?: UseYfmEditorProps['fileUploadHandler'];
        extensionOptions?: UseYfmEditorProps<T>['extensionOptions'];

        /**
         * If we need to set dimensions for uploaded images
         *
         * @default false
         */
        needToSetDimensionsForUploadedImages?: boolean;
    };

/**
 * @deprecated
 * The `YfmEditor` component will be removed soon.
 * Use `useYfmEditor` hook and `YfmEditorView` component instead.
 */
export const YfmEditor = React.forwardRef(function YfmEditor<T extends object>(
    {
        className,
        splitMode,
        autofocus,
        initialContent,
        initialEditorType = 'wysiwyg',
        initialMenuVisible: initialToolbarVisible = true,
        initialSplitModeEnabled = false,
        markupMenubarData: markupToolbarData,
        wysiwygMenubarData: wysiwygToolbarData,
        wysiwygExtraExtensions,
        wysiwygAllowHTML,
        wysiwygLinkify,
        wysiwygLinkifyTlds,
        wysiwygAttrs,
        wysiwygBreaks = true,
        extensionOptions,
        prepareRawMarkup,
        onMarkupChange,
        onMenuBarAction: onToolbarAction,
        onSplitModeEnabledChange,
        renderPreview,
        onEditorTypeChange,
        onMenuVisibleChange: onToolbarVisibleChange,
        onCancel,
        onSubmit,
        onFileUpload,
        needToSetDimensionsForUploadedImages,
        settingsVisible,
        toaster,
        wysiwygHiddenActionsConfig,
        markupHiddenActionsConfig,
        stickyToolbar = true,
    }: YfmEditorProps<T>,
    ref: React.Ref<YfmEditorRef>,
) {
    const editor = useYfmEditor({
        splitMode,
        renderPreview,
        initialMarkup: initialContent,
        initialEditorType,
        initialToolbarVisible,
        initialSplitModeEnabled,
        allowHTML: wysiwygAllowHTML,
        linkify: wysiwygLinkify,
        linkifyTlds: wysiwygLinkifyTlds,
        breaks: wysiwygBreaks,
        attrs: wysiwygAttrs,
        extraExtensions: wysiwygExtraExtensions,
        extensionOptions,
        prepareRawMarkup,
        fileUploadHandler: onFileUpload,
        needToSetDimensionsForUploadedImages,
    });

    const viewRef = React.useRef<HTMLDivElement>(null);
    const self = React.useMemo<YfmEditorRef>(() => {
        const editorRef = editor as YfmEditorRef;
        editorRef.domElem = () => viewRef.current;
        return editor as YfmEditorRef;
    }, [editor]);

    React.useImperativeHandle(ref, () => self, [self]);

    React.useLayoutEffect(() => {
        if (!onSplitModeEnabledChange) return;
        const cb = ({splitModeEnabled}: {splitModeEnabled: boolean}) => {
            onSplitModeEnabledChange(splitModeEnabled);
        };
        self.on('change-split-mode-enabled', cb);
        return () => {
            self.off('change-split-mode-enabled', cb);
        };
    });

    React.useLayoutEffect(() => {
        if (!onEditorTypeChange) return;
        const cb = ({type}: {type: YfmEditorType}) => {
            onEditorTypeChange(type);
        };
        self.on('change-editor-type', cb);
        return () => {
            self.off('change-editor-type', cb);
        };
    }, [onEditorTypeChange, self]);

    React.useLayoutEffect(() => {
        if (!onMarkupChange) return;
        const cb = () => {
            onMarkupChange(self, self.currentType);
        };
        self.on('change', cb);
        return () => {
            self.off('change', cb);
        };
    }, [onMarkupChange, self]);

    React.useLayoutEffect(() => {
        if (!onCancel) return;
        const cb = () => {
            onCancel(self);
        };
        self.on('cancel', cb);
        return () => {
            self.off('cancel', cb);
        };
    }, [onCancel, self]);

    React.useLayoutEffect(() => {
        if (!onSubmit) return;
        const cb = () => {
            onSubmit(self);
        };
        self.on('submit', cb);
        return () => {
            self.off('submit', cb);
        };
    }, [onSubmit, self]);

    React.useLayoutEffect(() => {
        if (!onToolbarAction) return;
        const cb = ({id, editorType}: {id: string; editorType: YfmEditorType}) => {
            onToolbarAction({action: id, editorType});
        };
        self.on('toolbar-action', cb);
        return () => {
            self.off('toolbar-action', cb);
        };
    }, [onToolbarAction, self]);

    React.useLayoutEffect(() => {
        if (!onToolbarVisibleChange) return;
        const cb = ({visible}: {visible: boolean}) => {
            onToolbarVisibleChange(visible);
        };
        self.on('change-toolbar-visibility', cb);
        return () => {
            self.off('change-toolbar-visibility', cb);
        };
    }, [onToolbarVisibleChange, self]);

    return (
        <YfmEditorView
            markupHiddenActionsConfig={markupHiddenActionsConfig}
            wysiwygHiddenActionsConfig={wysiwygHiddenActionsConfig}
            ref={viewRef}
            editor={editor}
            autofocus={autofocus}
            settingsVisible={settingsVisible}
            markupToolbarConfig={markupToolbarData}
            wysiwygToolbarConfig={wysiwygToolbarData}
            className={className}
            toaster={toaster}
            stickyToolbar={stickyToolbar}
        />
    );
}) as <T extends object = {}>(
    props: YfmEditorProps<T> & {ref?: React.Ref<YfmEditorRef>},
) => JSX.Element;

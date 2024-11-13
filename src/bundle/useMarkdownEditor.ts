import {useLayoutEffect, useMemo} from 'react';

import type {Extension} from '../core';
import {ReactRenderStorage} from '../extensions';
import {logger} from '../logger';

import {EditorImpl, type EditorInt} from './Editor';
import type {
    MarkdownEditorInstance,
    MarkdownEditorMode,
    MarkdownEditorOptions,
    MarkdownEditorPreset,
} from './types';
import {BundlePreset} from './wysiwyg-preset';

// [major] TODO: remove generic type
export type UseMarkdownEditorProps<T extends object = {}> = MarkdownEditorOptions<T>;

// [major] TODO: remove generic type
export function useMarkdownEditor<T extends object = {}>(
    props: UseMarkdownEditorProps<T>,
    deps: React.DependencyList = [],
): MarkdownEditorInstance {
    const editor = useMemo<EditorInt>(() => {
        const {
            md = {},
            initial = {},
            handlers = {},
            experimental = {},
            markupConfig = {},
            wysiwygConfig = {},
        } = props;

        const breaks = md.breaks ?? props.breaks;
        const preset: MarkdownEditorPreset = props.preset ?? 'full';
        const renderStorage = new ReactRenderStorage();
        const uploadFile = handlers.uploadFile ?? props.fileUploadHandler;
        const needToSetDimensionsForUploadedImages =
            experimental.needToSetDimensionsForUploadedImages ??
            props.needToSetDimensionsForUploadedImages;
        const enableNewImageSizeCalculation = experimental.enableNewImageSizeCalculation;

        const extensions: Extension = (builder) => {
            const extensionOptions = wysiwygConfig.extensionOptions ?? props.extensionOptions;

            builder.use(BundlePreset, {
                ...extensionOptions,
                preset,
                reactRenderer: renderStorage,
                onCancel: () => {
                    editor.emit('cancel', null);
                    return true;
                },
                onSubmit: () => {
                    editor.emit('submit', null);
                    return true;
                },
                mdBreaks: breaks,
                fileUploadHandler: uploadFile,
                needToSetDimensionsForUploadedImages,
                enableNewImageSizeCalculation,
            });
            {
                const extraExtensions = wysiwygConfig.extensions || props.extraExtensions;
                if (extraExtensions) {
                    builder.use(extraExtensions, props.extensionOptions);
                }
            }
        };
        return new EditorImpl({
            ...props,
            preset,
            renderStorage,
            md: {
                ...md,
                breaks,
                html: md.html ?? props.allowHTML,
                linkify: md.linkify ?? props.linkify,
                linkifyTlds: md.linkifyTlds ?? props.linkifyTlds,
            },
            initial: {
                ...initial,
                markup: initial.markup ?? props.initialMarkup,
                mode: initial.mode ?? props.initialEditorMode,
                toolbarVisible: initial.toolbarVisible ?? props.initialToolbarVisible,
                splitModeEnabled: initial.splitModeEnabled ?? props.initialSplitModeEnabled,
            },
            handlers: {
                ...handlers,
                uploadFile,
            },
            experimental: {
                ...experimental,
                needToSetDimensionsForUploadedImages,
                enableNewImageSizeCalculation,
                prepareRawMarkup: experimental.prepareRawMarkup ?? props.prepareRawMarkup,
                beforeEditorModeChange:
                    experimental.beforeEditorModeChange ??
                    props.experimental_beforeEditorModeChange,
            },
            markupConfig: {
                ...markupConfig,
                splitMode: markupConfig.splitMode ?? props.splitMode,
                renderPreview: markupConfig.renderPreview ?? props.renderPreview,
                extensions: markupConfig.extensions ?? props.extraMarkupExtensions,
            },
            wysiwygConfig: {
                ...wysiwygConfig,
                extensions,
                escapeConfig: wysiwygConfig.escapeConfig ?? props.escapeConfig,
            },
        });
    }, deps);

    useLayoutEffect(() => {
        function onToolbarAction({editorMode, id}: {editorMode: MarkdownEditorMode; id: string}) {
            logger.action({mode: editorMode, source: 'toolbar', action: id});
        }

        editor.on('toolbar-action', onToolbarAction);
        return () => {
            editor.off('toolbar-action', onToolbarAction);
            editor.destroy();
        };
    }, [editor]);
    return editor;
}

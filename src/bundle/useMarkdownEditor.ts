import {useLayoutEffect, useMemo} from 'react';

import type {Extension} from '../core';
import {getPMTransformers} from '../core/markdown/ProseMirrorTransformer/getTransformers';
import {ReactRenderStorage} from '../extensions';
import {logger} from '../logger';
import {DirectiveSyntaxContext} from '../utils/directive';

import {EditorImpl, type EditorInt} from './Editor';
import type {
    MarkdownEditorInstance,
    MarkdownEditorMode,
    MarkdownEditorOptions,
    MarkdownEditorPreset,
} from './types';
import {BundlePreset} from './wysiwyg-preset';

export type UseMarkdownEditorProps = MarkdownEditorOptions;

export function useMarkdownEditor(
    props: UseMarkdownEditorProps,
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

        const breaks = md.breaks;
        const preserveEmptyRows = experimental.preserveEmptyRows;
        const preset: MarkdownEditorPreset = props.preset ?? 'full';
        const renderStorage = new ReactRenderStorage();
        const uploadFile = handlers.uploadFile;
        const needToSetDimensionsForUploadedImages =
            experimental.needToSetDimensionsForUploadedImages;
        const enableNewImageSizeCalculation = experimental.enableNewImageSizeCalculation;

        const pmTransformers = getPMTransformers({
            emptyRowTransformer: preserveEmptyRows,
        });

        const directiveSyntax = new DirectiveSyntaxContext(experimental.directiveSyntax);

        const extensions: Extension = (builder) => {
            const extensionOptions = wysiwygConfig.extensionOptions;

            builder.use(BundlePreset, {
                ...extensionOptions,
                directiveSyntax,
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
                preserveEmptyRows: preserveEmptyRows,
                placeholderOptions: wysiwygConfig.placeholderOptions,
                mdBreaks: breaks,
                fileUploadHandler: uploadFile,
                needToSetDimensionsForUploadedImages,
                enableNewImageSizeCalculation,
            });
            {
                const extraExtensions = wysiwygConfig.extensions;
                if (extraExtensions) {
                    builder.use(extraExtensions, props.wysiwygConfig?.extensionOptions);
                }
            }
        };

        return new EditorImpl({
            ...props,
            preset,
            renderStorage,
            directiveSyntax,
            pmTransformers,
            md: {
                ...md,
                breaks,
                html: md.html,
                linkify: md.linkify,
                linkifyTlds: md.linkifyTlds,
            },
            initial: {
                ...initial,
                markup: initial.markup,
                mode: initial.mode,
                toolbarVisible: initial.toolbarVisible,
                splitModeEnabled: initial.splitModeEnabled,
            },
            handlers: {
                ...handlers,
                uploadFile,
            },
            experimental: {
                ...experimental,
                needToSetDimensionsForUploadedImages,
                enableNewImageSizeCalculation,
                prepareRawMarkup: experimental.prepareRawMarkup,
                beforeEditorModeChange: experimental.beforeEditorModeChange,
            },
            markupConfig: {
                ...markupConfig,
                splitMode: markupConfig.splitMode,
                renderPreview: markupConfig.renderPreview,
                extensions: markupConfig.extensions,
            },
            wysiwygConfig: {
                ...wysiwygConfig,
                extensions,
                escapeConfig: wysiwygConfig.escapeConfig,
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

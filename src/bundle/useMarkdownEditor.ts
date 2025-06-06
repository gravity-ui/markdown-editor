import {useLayoutEffect, useMemo} from 'react';

import type {Extension} from '../core';
import {getPMTransformers} from '../core/markdown/ProseMirrorTransformer/getTransformers';
import {ReactRenderStorage} from '../extensions';
import {Logger2, globalLogger} from '../logger';
import {DirectiveSyntaxContext} from '../utils/directive';

import {EditorImpl, type EditorInt} from './Editor';
import {wSelectionMenuConfigByPreset} from './config';
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
            logger = new Logger2(),
            mobile,
        } = props;

        const preset: MarkdownEditorPreset = props.preset ?? 'full';
        const renderStorage = new ReactRenderStorage();

        const pmTransformers = getPMTransformers({
            emptyRowTransformer: experimental.preserveEmptyRows,
        });

        const directiveSyntax = new DirectiveSyntaxContext(experimental.directiveSyntax);

        const extensions: Extension = (builder) => {
            const extensionOptions = wysiwygConfig.extensionOptions ?? {};

            if (mobile) {
                extensionOptions.selectionContext = {
                    config: wSelectionMenuConfigByPreset.zero,
                };
            }

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
                disableMdAttrs: wysiwygConfig.disableMarkdownAttrs,
                preserveEmptyRows: experimental.preserveEmptyRows,
                placeholderOptions: wysiwygConfig.placeholderOptions,
                mdBreaks: md.breaks,
                fileUploadHandler: handlers.uploadFile,
                needToSetDimensionsForUploadedImages:
                    experimental.needToSetDimensionsForUploadedImages,
                enableNewImageSizeCalculation: experimental.enableNewImageSizeCalculation,
                mobile,
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
            logger,
            preset,
            renderStorage,
            directiveSyntax,
            pmTransformers,
            md,
            initial,
            handlers,
            experimental,
            markupConfig,
            wysiwygConfig: {
                ...wysiwygConfig,
                extensions,
            },
        });
    }, deps);

    useLayoutEffect(() => {
        function onToolbarAction({editorMode, id}: {editorMode: MarkdownEditorMode; id: string}) {
            globalLogger.action({mode: editorMode, source: 'toolbar', action: id});
            editor.logger.action({mode: editorMode, source: 'toolbar', action: id});
        }

        editor.on('toolbar-action', onToolbarAction);
        return () => {
            editor.off('toolbar-action', onToolbarAction);
            editor.destroy();
        };
    }, [editor]);
    return editor;
}

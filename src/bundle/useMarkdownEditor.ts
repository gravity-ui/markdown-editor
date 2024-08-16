import {useLayoutEffect, useMemo} from 'react';

import {Extension} from '../core';
import {ReactRenderStorage} from '../extensions';
import {logger} from '../logger';

import {Editor, EditorImpl, EditorInt, EditorMode, EditorOptions, EditorPreset} from './Editor';
import {BundlePreset, ExtensionsOptions} from './wysiwyg-preset';

export type UseMarkdownEditorProps<T extends object = {}> = Omit<
    EditorOptions,
    'extensions' | 'renderStorage' | 'preset'
> & {
    /**
     * A set of plug-in extensions.
     *
     * @default 'full'
     */
    preset?: EditorPreset;
    breaks?: boolean;
    /** Used only first value. Сhanging the value will not lead to anything */
    extensionOptions?: Omit<ExtensionsOptions, 'reactRenderer'> & T;
    /** Used only first value. Сhanging the value will not lead to anything */
    extraExtensions?: Extension;
};

export function useMarkdownEditor<T extends object = {}>(
    props: UseMarkdownEditorProps<T>,
    deps: React.DependencyList = [],
): Editor {
    const editor = useMemo<EditorInt>(
        () => {
            const preset: EditorPreset = props.preset ?? 'full';
            const renderStorage = new ReactRenderStorage();
            const extensions: Extension = (builder) => {
                builder.use(BundlePreset, {
                    ...props.extensionOptions,
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
                    mdBreaks: props.breaks,
                    fileUploadHandler: props.fileUploadHandler,
                    needToSetDimensionsForUploadedImages:
                        props.needToSetDimensionsForUploadedImages,
                });
                if (props.extraExtensions) {
                    builder.use(props.extraExtensions, props.extensionOptions);
                }
            };

            return new EditorImpl({...props, extensions, renderStorage, preset});
        },
        deps.concat(
            props.allowHTML,
            props.linkify,
            props.linkifyTlds,
            props.breaks,
            props.splitMode,
            props.needToSetDimensionsForUploadedImages,
        ),
    );

    useLayoutEffect(() => {
        function onToolbarAction({editorMode, id}: {editorMode: EditorMode; id: string}) {
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

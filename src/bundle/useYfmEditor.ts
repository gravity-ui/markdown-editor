import {useLayoutEffect, useMemo} from 'react';

import {Extension} from '../core';
import {ReactRenderStorage} from '../extensions';
import {logger} from '../logger';

import {Editor, EditorImpl, EditorInt, EditorOptions, EditorType} from './Editor';
import {BundlePreset, ExtensionsOptions} from './wysiwyg-preset';

export type UseYfmEditorProps<T extends object = {}> = Omit<
    EditorOptions,
    'extensions' | 'renderStorage'
> & {
    breaks?: boolean;
    /** Used only first value. Сhanging the value will not lead to anything */
    extensionOptions?: Omit<ExtensionsOptions, 'reactRenderer'> & T;
    /** Used only first value. Сhanging the value will not lead to anything */
    extraExtensions?: Extension;
};

export function useYfmEditor<T extends object = {}>(
    props: UseYfmEditorProps<T>,
    deps: React.DependencyList = [],
): Editor {
    const editor = useMemo<EditorInt>(
        () => {
            const renderStorage = new ReactRenderStorage();
            const extensions: Extension = (builder) => {
                builder.use(BundlePreset, {
                    ...props.extensionOptions,
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
            return new EditorImpl({...props, extensions, renderStorage});
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
        function onToolbarAction({editorType, id}: {editorType: EditorType; id: string}) {
            logger.action({mode: editorType, source: 'toolbar', action: id});
        }

        editor.on('toolbar-action', onToolbarAction);
        return () => {
            editor.off('toolbar-action', onToolbarAction);
            editor.destroy();
        };
    }, [editor]);
    return editor;
}

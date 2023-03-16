import React from 'react';
import {useUpdate} from 'react-use';
import {YfmEditor, YfmEditorOptions} from '../core';

export type UseYfmEditorProps = YfmEditorOptions & {};

export function useYfmEditor(props: UseYfmEditorProps) {
    const rerender = useUpdate();
    const changeRef = React.useRef(props.onChange);
    changeRef.current = props.onChange;

    const editor = React.useMemo(() => {
        return new YfmEditor({
            ...props,
            onChange(e) {
                changeRef.current?.(e);
                // need to re-render react view, based on editor state
                rerender();
            },
        });
    }, [props.extensions, props.allowHTML, props.linkify, props.linkifyTlds]);

    // Commented out for support react@18 strict mode
    // React.useEffect(() => {
    //     return () => {
    //         editor.destroy();
    //     };
    // }, [editor]);

    return editor;
}

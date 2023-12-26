import React from 'react';

import type {YfmEditor} from '../core';

export type YfmEditorComponentProps = {
    className?: string;
    autofocus?: boolean;
    editor: YfmEditor;
    children?: React.ReactNode;
};

export const YfmEditorComponent: React.FC<YfmEditorComponentProps> = ({
    className,
    autofocus,
    editor,
    children,
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const {current} = ref;
        if (current) {
            current.appendChild(editor.dom);
            if (autofocus) {
                editor.focus();
            }
        }
    }, [editor]);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
};

YfmEditorComponent.displayName = 'YfmEditorComponent';

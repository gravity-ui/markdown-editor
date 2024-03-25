import React from 'react';

import type {EditorInt} from './Editor';

export type WysiwygEditorComponentProps = {
    className?: string;
    autofocus?: boolean;
    editor: EditorInt;
    children?: React.ReactNode;
};

export const WysiwygEditorComponent: React.FC<WysiwygEditorComponentProps> =
    function WysiwygEditorComponent({className, autofocus, editor, children}) {
        const ref = React.useRef<HTMLDivElement>(null);
        React.useEffect(() => {
            const {current} = ref;
            if (current) {
                current.appendChild(editor.wysiwygEditor.dom);
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

import {useEffect, useRef} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import type {EditorInt} from './Editor';

export type WysiwygEditorComponentProps = QAProps & {
    className?: string;
    autofocus?: boolean;
    editor: EditorInt;
    children?: React.ReactNode;
};

export const WysiwygEditorComponent: React.FC<WysiwygEditorComponentProps> =
    function WysiwygEditorComponent({className, autofocus, editor, children, qa}) {
        const ref = useRef<HTMLDivElement>(null);
        useEffect(() => {
            const {current} = ref;
            if (current) {
                current.appendChild(editor.wysiwygEditor.dom);
                if (autofocus) {
                    editor.focus();
                }
            }
        }, [editor]);

        return (
            <div data-qa={qa} ref={ref} className={className}>
                {children}
            </div>
        );
    };

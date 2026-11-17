import {useEffect, useLayoutEffect, useRef} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import type {EditorInt} from './Editor';
import type {WysiwygContenteditableAttributes} from './types';

export type WysiwygEditorComponentProps = QAProps & {
    className?: string;
    autofocus?: boolean;
    contenteditableAttributes?: WysiwygContenteditableAttributes;
    editor: EditorInt;
    children?: React.ReactNode;
};

export const WysiwygEditorComponent: React.FC<WysiwygEditorComponentProps> =
    function WysiwygEditorComponent({
        className,
        autofocus,
        editor,
        contenteditableAttributes,
        children,
        qa,
    }) {
        const ref = useRef<HTMLDivElement>(null);
        const wysiwygEditor = editor.wysiwygEditor;

        useLayoutEffect(() => {
            wysiwygEditor.setInputAttributes(contenteditableAttributes);
        }, [wysiwygEditor, contenteditableAttributes]);

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

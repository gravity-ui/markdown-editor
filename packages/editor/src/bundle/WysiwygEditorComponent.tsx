import {useEffect, useLayoutEffect, useRef} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import type {EditorInt} from './Editor';
import {
    type WysiwygContenteditableAttributes,
    filterContenteditableAttributes,
    wysiwygForbiddenAttributes,
} from './contenteditable-attributes';

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
        const view = editor.wysiwygEditor.view;

        useLayoutEffect(() => {
            if (view.isDestroyed) return;
            view.setProps({
                attributes: filterContenteditableAttributes(
                    contenteditableAttributes,
                    wysiwygForbiddenAttributes,
                ),
            });
        }, [view, contenteditableAttributes]);

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

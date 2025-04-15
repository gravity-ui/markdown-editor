import {useEffect, useLayoutEffect, useRef} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import type {EditorInt} from './Editor';

export type MarkupEditorComponentProps = QAProps & {
    editor: EditorInt;
    autofocus?: boolean;
    className?: string;
    children?: React.ReactNode;
};

export const MarkupEditorComponent: React.FC<MarkupEditorComponentProps> =
    function MarkupEditorComponent({editor, autofocus, className, children, qa}) {
        const ref = useRef<HTMLDivElement>(null);

        // insert editor to dom
        useLayoutEffect(() => {
            const domElem = editor.markupEditor.cm.dom;
            if (ref.current) {
                ref.current.appendChild(domElem);
            }
            return () => {
                domElem.remove();
            };
        }, [editor.markupEditor]);

        // update editor after connecting to dom
        useEffect(() => {
            editor.markupEditor.cm.requestMeasure();
            if (autofocus) {
                editor.markupEditor.focus();
            }
        }, [editor.markupEditor]);

        return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
                data-qa={qa}
                ref={ref}
                className={className}
                onClick={(event) => {
                    const target = event.target;

                    if (target instanceof Element && target.classList.contains('cm-editor')) {
                        editor.markupEditor.focus();
                    }
                }}
            >
                {children}
            </div>
        );
    };

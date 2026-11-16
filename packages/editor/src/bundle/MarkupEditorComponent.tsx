import {useEffect, useLayoutEffect, useRef} from 'react';

import {EditorView} from '@codemirror/view';
import type {QAProps} from '@gravity-ui/uikit';

import {inputAttributesCompartment} from '../markup/codemirror/input-attributes';

import type {EditorInt} from './Editor';
import {
    type MarkupContenteditableAttributes,
    filterContenteditableAttributes,
    markupForbiddenAttributes,
} from './contenteditable-attributes';

export type MarkupEditorComponentProps = QAProps & {
    editor: EditorInt;
    autofocus?: boolean;
    contenteditableAttributes?: MarkupContenteditableAttributes;
    className?: string;
    children?: React.ReactNode;
};

export const MarkupEditorComponent: React.FC<MarkupEditorComponentProps> =
    function MarkupEditorComponent({
        editor,
        autofocus,
        className,
        contenteditableAttributes,
        children,
        qa,
    }) {
        const ref = useRef<HTMLDivElement>(null);
        const view = editor.markupEditor.cm;

        useLayoutEffect(() => {
            view.dispatch({
                effects: inputAttributesCompartment.reconfigure(
                    EditorView.contentAttributes.of(
                        filterContenteditableAttributes(
                            contenteditableAttributes,
                            markupForbiddenAttributes,
                        ),
                    ),
                ),
            });
        }, [view, contenteditableAttributes]);

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

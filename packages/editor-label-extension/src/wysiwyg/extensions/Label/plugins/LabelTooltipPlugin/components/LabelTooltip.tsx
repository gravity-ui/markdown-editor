import {useEffect, useRef} from 'react';

import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {labelCn, normalizeLabelColor} from '@gravity-ui/markdown-plugin-label';
import {Button, TextInput} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {LabelAttr} from '../../../LabelSpecs';
import {updateLabel} from '../../../commands';
import type {ExistingLabel} from '../../ExistingLabelsPlugin';

import {LabelColors} from './LabelColors';

import './LabelTooltip.scss';

const b = cn('label-tooltip');

export type LabelTooltipProps = {
    node: Node;
    pos: number;
    view: EditorView;
    /** The label is opened by a click or an insertion, so the caption field takes the focus. */
    editId: number | null;
    suggestions: readonly ExistingLabel[];
};

export function LabelTooltip({node, pos, view, editId, suggestions}: LabelTooltipProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const text: string = node.attrs[LabelAttr.Text];
    const color = normalizeLabelColor(node.attrs[LabelAttr.Color]);

    // Let toolbar popovers finish restoring editor focus before focusing the caption.
    useEffect(() => {
        let active = true;
        queueMicrotask(() => {
            if (active && editId !== null) {
                inputRef.current?.focus({preventScroll: true});
                inputRef.current?.select();
            }
        });
        return () => {
            active = false;
        };
    }, [editId]);

    const update = (attrs: Parameters<typeof updateLabel>[1]) =>
        updateLabel(pos, attrs)(view.state, view.dispatch);

    // Moving the selection out of the label closes the popover.
    const close = () => {
        const {state} = view;
        const selection = TextSelection.near(state.doc.resolve(pos + node.nodeSize));

        view.dispatch(state.tr.setSelection(selection));
        view.focus();
    };

    return (
        <div
            className={b()}
            role="dialog"
            aria-label={i18n('button')}
            onKeyDownCapture={(event) => {
                const controls = event.currentTarget.querySelectorAll(
                    'input, button:not(:disabled)',
                );
                const leavesPalette =
                    event.key === 'Tab' &&
                    !event.shiftKey &&
                    event.target === controls[controls.length - 1];
                if (event.key === 'Escape' || leavesPalette) {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                    return;
                }
                // Shortcuts from a button, such as undo, run in the editor.
                if (
                    (event.ctrlKey || event.metaKey) &&
                    event.target !== inputRef.current &&
                    view.someProp('handleKeyDown', (handle) => handle(view, event.nativeEvent))
                ) {
                    event.preventDefault();
                    view.focus();
                }
            }}
        >
            <TextInput
                className={b('input')}
                controlRef={inputRef}
                controlProps={{'aria-label': i18n('placeholder')}}
                hasClear
                value={text}
                placeholder={i18n('placeholder')}
                onUpdate={(value) => {
                    update({[LabelAttr.Text]: value});
                    if (!value) inputRef.current?.focus({preventScroll: true});
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        close();
                    }
                }}
            />
            <LabelColors value={color} onSelect={(value) => update({[LabelAttr.Color]: value})} />
            {suggestions.length > 0 && (
                <div className={b('suggestions')} role="group" aria-label={i18n('existing_labels')}>
                    {suggestions.map((suggestion) => (
                        <Button
                            key={JSON.stringify([suggestion.text, suggestion.color])}
                            className={b('suggestion')}
                            view="flat"
                            size="m"
                            title={suggestion.text}
                            aria-label={i18n('existing_label', {
                                caption: suggestion.text,
                                color: i18n(`color_${suggestion.color}`).toLowerCase(),
                            })}
                            onClick={() => {
                                update({
                                    [LabelAttr.Text]: suggestion.text,
                                    [LabelAttr.Color]: suggestion.color,
                                });
                                close();
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                    event.preventDefault();
                                    const buttons =
                                        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                                            'button',
                                        );
                                    if (!buttons?.length) return;
                                    const index = Array.from(buttons).indexOf(event.currentTarget);
                                    const direction = event.key === 'ArrowDown' ? 1 : -1;
                                    buttons[
                                        (index + direction + buttons.length) % buttons.length
                                    ].focus();
                                }
                            }}
                        >
                            <span className={labelCn({color: suggestion.color})}>
                                <span className={labelCn('text')}>{suggestion.text}</span>
                            </span>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

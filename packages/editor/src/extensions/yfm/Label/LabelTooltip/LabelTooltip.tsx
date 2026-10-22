import {useEffect, useRef} from 'react';

import {Button, Label, TextInput} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import {TextSelection} from '#pm/state';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/label';
import {ColorPalette} from 'src/react-utils/components/ColorPalette';

import {LabelAttr, labelColors, labelThemes, normalizeLabelColor} from '../LabelSpecs';
import {updateLabel} from '../commands';
import type {ExistingLabel} from '../existing-labels-plugin';

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

    const items = labelColors.map((itemColor) => ({
        value: itemColor,
        title: i18n(`color_${itemColor}`),
        swatch: <span className={b('swatch', {color: itemColor})} />,
    }));

    return (
        <div
            className={b()}
            role="group"
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
            <ColorPalette
                className={b('colors')}
                ariaLabel={i18n('color')}
                items={items}
                value={color}
                columns={items.length}
                onSelect={(value) => update({[LabelAttr.Color]: value})}
            />
            {suggestions.length > 0 && (
                <div className={b('suggestions')} role="group" aria-label={i18n('existing_labels')}>
                    {suggestions.map((suggestion) => (
                        <Button
                            key={JSON.stringify([suggestion.text, suggestion.color])}
                            className={b('suggestion')}
                            view="flat"
                            size="m"
                            title={suggestion.text}
                            aria-label={`${suggestion.text}, ${i18n(`color_${suggestion.color}`)}`}
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
                            <Label theme={labelThemes[suggestion.color]} size="xs">
                                {suggestion.text}
                            </Label>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

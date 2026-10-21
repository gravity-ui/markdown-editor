import {useEffect, useRef} from 'react';

import {TextInput} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import {TextSelection} from '#pm/state';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/label';
import {ColorPalette} from 'src/react-utils/components/ColorPalette';

import {LabelAttr, labelColors, normalizeLabelColor} from '../LabelSpecs';
import {updateLabel} from '../commands';

import './LabelTooltip.scss';

const b = cn('label-tooltip');

export type LabelTooltipProps = {
    node: Node;
    pos: number;
    view: EditorView;
    /** The label is opened by a click or an insertion, so the caption field takes the focus. */
    edited: boolean;
};

export function LabelTooltip({node, pos, view, edited}: LabelTooltipProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const text: string = node.attrs[LabelAttr.Text];
    const color = normalizeLabelColor(node.attrs[LabelAttr.Color]);

    // `autoFocus` covers a popover opened for editing, the effect covers `Enter` on an open one.
    useEffect(() => {
        if (edited) inputRef.current?.focus();
    }, [edited]);

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
        <div className={b()}>
            <TextInput
                controlRef={inputRef}
                autoFocus={edited}
                hasClear
                value={text}
                placeholder={i18n('placeholder')}
                onUpdate={(value) => update({[LabelAttr.Text]: value})}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === 'Escape') close();
                }}
            />
            <ColorPalette
                className={b('colors')}
                items={items}
                value={color}
                columns={items.length}
                onSelect={(value) => update({[LabelAttr.Color]: value})}
            />
        </div>
    );
}

import {Check} from '@gravity-ui/icons';
import {Icon, TextInput} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import {TextSelection} from '#pm/state';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/status';

import {StatusAttr, normalizeStatusColor, statusCn, statusColors} from '../StatusSpecs';
import {updateStatus} from '../commands';

import './StatusTooltip.scss';

const b = cn('status-tooltip');

export type StatusTooltipProps = {
    node: Node;
    pos: number;
    view: EditorView;
};

export function StatusTooltip({node, pos, view}: StatusTooltipProps) {
    const text: string = node.attrs[StatusAttr.Text];
    const color = normalizeStatusColor(node.attrs[StatusAttr.Color]);

    const update = (attrs: Parameters<typeof updateStatus>[1]) =>
        updateStatus(pos, attrs)(view.state, view.dispatch);

    // Moving the selection out of the badge closes the popover.
    const close = () => {
        const {state} = view;
        const selection = TextSelection.near(state.doc.resolve(pos + node.nodeSize));

        view.dispatch(state.tr.setSelection(selection));
        view.focus();
    };

    return (
        <div className={b()}>
            <TextInput
                autoFocus
                size="s"
                value={text}
                placeholder={i18n('placeholder')}
                onUpdate={(value) => update({[StatusAttr.Text]: value})}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') close();
                }}
            />
            <div className={b('colors')}>
                {statusColors.map((itemColor) => {
                    const selected = itemColor === color;
                    const label = i18n(`color_${itemColor}`);

                    return (
                        <button
                            key={itemColor}
                            type="button"
                            className={statusCn({color: itemColor, swatch: true})}
                            title={label}
                            aria-label={label}
                            aria-pressed={selected}
                            tabIndex={selected ? undefined : -1}
                            onClick={() => update({[StatusAttr.Color]: itemColor})}
                        >
                            {selected ? <Icon data={Check} size={16} /> : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

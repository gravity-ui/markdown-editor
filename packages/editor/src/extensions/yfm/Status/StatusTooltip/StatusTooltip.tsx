import {Check} from '@gravity-ui/icons';
import {Button, Icon, TextInput} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/status';

import {Colors} from '../../Color/const';
import {StatusAttr, normalizeStatusColor, statusCn, statusColors} from '../StatusSpecs';
import {updateStatus} from '../commands';

import './StatusTooltip.scss';

const b = cn('status-tooltip');

const colorTitleKeys = {
    [Colors.Gray]: 'color_gray',
    [Colors.Blue]: 'color_blue',
    [Colors.Green]: 'color_green',
    [Colors.Yellow]: 'color_yellow',
    [Colors.Orange]: 'color_orange',
    [Colors.Red]: 'color_red',
    [Colors.Violet]: 'color_violet',
} as const satisfies Record<Colors, string>;

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

    return (
        <div className={b()}>
            <TextInput
                autoFocus
                size="s"
                value={text}
                placeholder={i18n('placeholder')}
                onUpdate={(value) => update({[StatusAttr.Text]: value})}
            />
            <div className={b('colors')}>
                {statusColors.map((itemColor) => (
                    <Button
                        key={itemColor}
                        size="s"
                        view="flat"
                        selected={itemColor === color}
                        title={i18n(colorTitleKeys[itemColor])}
                        onClick={() => update({[StatusAttr.Color]: itemColor})}
                    >
                        <span className={statusCn({color: itemColor}, [b('swatch')])}>
                            {itemColor === color ? <Icon data={Check} size={12} /> : null}
                        </span>
                    </Button>
                ))}
            </div>
        </div>
    );
}

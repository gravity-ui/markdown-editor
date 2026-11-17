import {cn} from '@gravity-ui/markdown-editor';
import {type LabelColor, labelColors} from '@gravity-ui/markdown-plugin-label';
import {Tooltip} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';

import './LabelColors.scss';

const b = cn('label-colors');

export type LabelColorsProps = {
    value: LabelColor;
    onSelect: (value: LabelColor) => void;
};

export function LabelColors({value, onSelect}: LabelColorsProps) {
    return (
        <div className={b()} role="group" aria-label={i18n('color')}>
            {labelColors.map((color) => (
                <Tooltip
                    key={color}
                    openDelay={200}
                    placement="bottom"
                    content={i18n(`color_${color}`)}
                >
                    <button
                        type="button"
                        className={b('swatch', {color})}
                        aria-label={i18n(`color_${color}`)}
                        aria-pressed={color === value}
                        onClick={() => onSelect(color)}
                    />
                </Tooltip>
            ))}
        </div>
    );
}

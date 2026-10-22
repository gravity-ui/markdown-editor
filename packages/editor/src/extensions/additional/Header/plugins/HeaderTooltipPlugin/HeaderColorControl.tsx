import {Icon, Select} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {Colors} from 'src/extensions/yfm/Color/const';
import {CellBgPalette} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/components/CellBgPalette';
import {i18n} from 'src/i18n/header';
import {i18n as menubarI18n} from 'src/i18n/menubar';
import {TextColorIcon} from 'src/icons';

import './HeaderColorControl.scss';

const b = cn('header-color');
export function HeaderColorControl({
    label,
    value,
    onUpdate,
    onOpenChange,
}: {
    label: string;
    value: string;
    onUpdate: (value: string | null) => void;
    onOpenChange?: (open: boolean) => void;
}) {
    return (
        <Select
            width="max"
            aria-label={label}
            value={[value]}
            onOpenChange={onOpenChange}
            options={['auto', ...Object.values(Colors)].map((color) => ({
                value: color,
                text:
                    color === 'auto'
                        ? i18n('text_auto')
                        : menubarI18n(`colorify__color_${color as Colors}`),
                content: (
                    <span className={b('option')}>
                        <span className={b('text-icon')} data-color={color}>
                            <Icon data={TextColorIcon} size={16} />
                        </span>
                        {color === 'auto'
                            ? i18n('text_auto')
                            : menubarI18n(`colorify__color_${color as Colors}`)}
                    </span>
                ),
            }))}
            onUpdate={([color]) => onUpdate(color === 'auto' ? null : color)}
        />
    );
}
export function HeaderFillPalette({
    value,
    onUpdate,
}: {
    value: string;
    onUpdate: (value: string | null) => void;
}) {
    return (
        <div
            className={b('fill-palette')}
            role="group"
            aria-label={`${i18n('color')} ${i18n('palette')}`}
        >
            <CellBgPalette value={value} onSelect={onUpdate} />
        </div>
    );
}

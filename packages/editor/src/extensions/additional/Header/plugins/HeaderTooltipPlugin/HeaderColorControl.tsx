import {useRef, useState} from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import {Button, Icon, Popup} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {CellBgPalette} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/components/CellBgPalette';
import {CELL_BG_SWATCHES} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/components/CellBgPalette/colors';
import {i18n} from 'src/i18n/header';
import {i18n as tableI18n} from 'src/i18n/yfm-table';

import './HeaderColorControl.scss';

const b = cn('header-color');
const aliases: Record<string, string> = {
    'light-blue': 'blue-light',
    sky: 'blue-light',
    indigo: 'purple',
    violet: 'purple-light',
    teal: 'green',
    amber: 'yellow',
    sand: 'yellow-light',
    navy: 'blue',
};

export function HeaderColorControl({
    kind,
    label,
    value,
    onUpdate,
}: {
    kind: 'text' | 'fill';
    label: string;
    value: string;
    onUpdate: (value: string | null) => void;
}) {
    const anchor = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const paletteValue = value === 'auto' || value === 'primary' ? '' : (aliases[value] ?? value);
    const swatch = CELL_BG_SWATCHES.find((item) => item.value === paletteValue);
    const name = swatch
        ? tableI18n(swatch.i18nKey)
        : i18n(`text_${value}` as Parameters<typeof i18n>[0]);
    const paletteLabel = `${label} ${i18n('palette')}`;

    return (
        <>
            <Button
                ref={anchor}
                className={b('trigger')}
                view="outlined"
                size="m"
                width="max"
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <span className={b('value')}>
                    <span
                        aria-hidden
                        className={b('swatch', {kind, color: paletteValue || 'none'})}
                    />
                    <span className={b('name')}>{name}</span>
                    <Icon data={ChevronDown} size={16} />
                </span>
            </Button>
            <Popup
                open={open}
                anchorElement={anchor.current}
                placement={['bottom-end', 'top-end']}
                onOpenChange={setOpen}
            >
                <div className={b('palette', {kind})} role="dialog" aria-label={paletteLabel}>
                    <CellBgPalette
                        value={paletteValue}
                        onSelect={(color) => {
                            setOpen(false);
                            onUpdate(color);
                        }}
                    />
                </div>
            </Popup>
        </>
    );
}

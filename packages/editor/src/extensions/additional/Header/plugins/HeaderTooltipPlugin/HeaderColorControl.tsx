import {useRef, useState} from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import {Button, Icon, Palette, Popup} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {Colors} from 'src/extensions/yfm/Color/const';
import {CellBgPalette} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/components/CellBgPalette';
import {CELL_BG_SWATCHES} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/components/CellBgPalette/colors';
import {i18n} from 'src/i18n/header';
import {i18n as menubarI18n} from 'src/i18n/menubar';
import {i18n as tableI18n} from 'src/i18n/yfm-table';

import './HeaderColorControl.scss';

const b = cn('header-color');
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
    const textColors = Object.values(Colors).map((color) => ({
        value: color,
        title: menubarI18n(`colorify__color_${color}`),
    }));
    const paletteValue = value === 'auto' ? '' : value;
    const swatch = CELL_BG_SWATCHES.find((item) => item.value === paletteValue);
    const name =
        kind === 'text'
            ? (textColors.find((color) => color.value === paletteValue)?.title ?? i18n('text_auto'))
            : swatch
              ? tableI18n(swatch.i18nKey)
              : i18n('no_background');
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
                <div
                    className={b('palette', {kind})}
                    role="dialog"
                    aria-label={paletteLabel}
                    onMouseDownCapture={
                        kind === 'text' ? (event) => event.preventDefault() : undefined
                    }
                >
                    {kind === 'text' ? (
                        <Palette
                            multiple={false}
                            columns={4}
                            value={[paletteValue]}
                            options={[{value: '', title: i18n('no_color')}, ...textColors].map(
                                ({value: color, title}) => ({
                                    value: color,
                                    title,
                                    content: (
                                        <span
                                            className={b('text-swatch')}
                                            data-color={color || 'default'}
                                        />
                                    ),
                                }),
                            )}
                            onUpdate={([color]) => {
                                onUpdate(color || null);
                                setOpen(false);
                            }}
                        />
                    ) : (
                        <CellBgPalette
                            value={paletteValue}
                            onSelect={(color) => {
                                setOpen(false);
                                onUpdate(color);
                            }}
                        />
                    )}
                </div>
            </Popup>
        </>
    );
}

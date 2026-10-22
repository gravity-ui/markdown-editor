import {cn} from 'src/classname';
import {i18n} from 'src/i18n/yfm-table';
import {ColorPalette} from 'src/react-utils/components/ColorPalette';

import {CELL_BG_SWATCHES, type CellBgValue, NO_COLOR_VALUE} from './colors';

import './CellBgPalette.scss';

const b = cn('yfm-table-cell-bg-palette');

export type CellBgPaletteProps = {
    value?: string | null;
    onSelect: (color: string | null) => void;
};

export const CellBgPalette: React.FC<CellBgPaletteProps> = function YfmTableCellBgPalette({
    value,
    onSelect,
}) {
    const items = CELL_BG_SWATCHES.map((swatch) => ({
        value: swatch.value,
        title: i18n(swatch.i18nKey),
        swatch: (
            <span
                className={b('swatch', {
                    none: swatch.value === NO_COLOR_VALUE,
                    color: swatch.value || undefined,
                })}
            />
        ),
    }));

    return (
        <ColorPalette
            className={b()}
            items={items}
            value={(value || NO_COLOR_VALUE) as CellBgValue}
            columns={CELL_BG_SWATCHES.length / 2}
            onSelect={(swatchValue) =>
                onSelect(swatchValue === NO_COLOR_VALUE ? null : swatchValue)
            }
        />
    );
};

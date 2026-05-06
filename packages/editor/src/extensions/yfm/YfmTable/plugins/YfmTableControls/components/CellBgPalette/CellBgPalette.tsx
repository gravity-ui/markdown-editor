import {useMemo} from 'react';

import {Palette, type PaletteOption} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/yfm-table';

import {CELL_BG_COLORS} from './colors';

import './CellBgPalette.scss';

const b = cn('yfm-table-cell-bg-palette');

const NO_COLOR_VALUE = '';

export type CellBgPaletteProps = {
    value?: string | null;
    onSelect: (color: string | null) => void;
};

export const CellBgPalette: React.FC<CellBgPaletteProps> = function YfmTableCellBgPalette({
    // value,
    onSelect,
}) {
    const options = useMemo<PaletteOption[]>(
        () => [
            {
                value: NO_COLOR_VALUE,
                content: <span className={b('swatch', {none: true})} />,
                title: i18n('cells.bg.none'),
            },
            ...CELL_BG_COLORS.map((color) => ({
                value: color,
                content: <span className={b('swatch', {color})} />,
                title: i18n(`cells.bg.${color}`),
            })),
        ],
        [],
    );

    // const paletteValue = useMemo(() => (value ? [value] : [NO_COLOR_VALUE]), [value]);

    const handleUpdate = (values: string[]) => {
        const selected = values[0] ?? NO_COLOR_VALUE;
        onSelect(selected === NO_COLOR_VALUE ? null : selected);
    };

    return (
        <Palette
            multiple={false}
            // value={paletteValue}
            options={options}
            columns={4}
            onUpdate={handleUpdate}
            className={b()}
        />
    );
};

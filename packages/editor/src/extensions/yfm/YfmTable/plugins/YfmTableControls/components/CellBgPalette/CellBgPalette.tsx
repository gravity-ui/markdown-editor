import {Check} from '@gravity-ui/icons';
import {Box, Icon, Tooltip} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/yfm-table';

import {CELL_BG_SWATCHES} from './colors';

import './CellBgPalette.scss';

const b = cn('yfm-table-cell-bg-palette');

const NO_COLOR_VALUE = '';

export type CellBgPaletteProps = {
    value?: string | null;
    onSelect: (color: string | null) => void;
};

export const CellBgPalette: React.FC<CellBgPaletteProps> = function YfmTableCellBgPalette({
    value,
    onSelect,
}) {
    const handleClick = (swatchValue: string) => {
        if (swatchValue === value || (swatchValue === NO_COLOR_VALUE && !value)) return;
        onSelect(swatchValue === NO_COLOR_VALUE ? null : swatchValue);
    };

    return (
        <div className={b()}>
            {CELL_BG_SWATCHES.map((swatch, index) => {
                const isSelected =
                    swatch.value === NO_COLOR_VALUE ? !value : swatch.value === value;
                const isTopRow = index < CELL_BG_SWATCHES.length / 2;

                return (
                    <Tooltip
                        key={swatch.value}
                        openDelay={200}
                        placement={isTopRow ? 'top' : 'bottom'}
                        content={i18n(swatch.i18nKey)}
                    >
                        <Box className={b('item')} spacing={{p: 1}}>
                            <button
                                type="button"
                                className={b('swatch', {
                                    none: swatch.value === NO_COLOR_VALUE,
                                    color: swatch.value || undefined,
                                })}
                                onClick={() => handleClick(swatch.value)}
                            >
                                {isSelected && (
                                    <span className={b('check')}>
                                        <Icon data={Check} size={16} />
                                    </span>
                                )}
                            </button>
                        </Box>
                    </Tooltip>
                );
            })}
        </div>
    );
};

import {Check} from '@gravity-ui/icons';
import {Icon, Tooltip, spacing} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/yfm-table';

import {CELL_BG_SWATCHES, NO_COLOR_VALUE} from './colors';

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
                        <button
                            type="button"
                            className={spacing({p: 1}, b('item'))}
                            aria-label={i18n(swatch.i18nKey)}
                            aria-pressed={isSelected}
                            onClick={() => handleClick(swatch.value)}
                            // Parent Menu.Item listens for Enter/Space and re-opens its popup,
                            // shadowing the button's native activation. Handle the keys here
                            // and stop propagation so the swatch is actually selected.
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleClick(swatch.value);
                                }
                            }}
                        >
                            <span
                                className={b('swatch', {
                                    none: swatch.value === NO_COLOR_VALUE,
                                    color: swatch.value || undefined,
                                })}
                            >
                                {isSelected && (
                                    <span className={b('check')}>
                                        <Icon data={Check} size={16} />
                                    </span>
                                )}
                            </span>
                        </button>
                    </Tooltip>
                );
            })}
        </div>
    );
};

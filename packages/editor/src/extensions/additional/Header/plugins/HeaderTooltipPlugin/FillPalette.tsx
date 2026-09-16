import {Check} from '@gravity-ui/icons';
import {Icon, Tooltip, spacing} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import {HEADER_FILL_SWATCHES, type HeaderFillValue} from '../../HeaderSpecs';

import './FillPalette.scss';

const b = cn('header-fill-palette');

export type FillPaletteProps = {
    value: HeaderFillValue;
    onSelect: (value: HeaderFillValue) => void;
};

export const FillPalette: React.FC<FillPaletteProps> = function HeaderFillPalette({
    value,
    onSelect,
}) {
    return (
        <div className={b()}>
            {HEADER_FILL_SWATCHES.map((swatch, index) => {
                const label = i18n(swatch.i18nKey);
                const isSelected = swatch.value === value;

                return (
                    <Tooltip
                        key={swatch.value}
                        openDelay={200}
                        placement={index < HEADER_FILL_SWATCHES.length / 2 ? 'top' : 'bottom'}
                        content={label}
                    >
                        <button
                            type="button"
                            className={spacing({p: 1}, b('item'))}
                            aria-label={label}
                            aria-pressed={isSelected}
                            onClick={() => onSelect(swatch.value)}
                        >
                            <span className={b('swatch', {color: swatch.value})}>
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

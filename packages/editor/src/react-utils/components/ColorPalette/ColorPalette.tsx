import {Check} from '@gravity-ui/icons';
import {Icon, Tooltip, spacing} from '@gravity-ui/uikit';

import {cn} from 'src/classname';

import './ColorPalette.scss';

const b = cn('color-palette');

export type ColorPaletteItem<T extends string> = {
    value: T;
    title: string;
    swatch: React.ReactNode;
};

export type ColorPaletteProps<T extends string> = {
    items: readonly ColorPaletteItem<T>[];
    value: T;
    columns: number;
    className?: string;
    onSelect: (value: T) => void;
};

export function ColorPalette<T extends string>({
    items,
    value,
    columns,
    className,
    onSelect,
}: ColorPaletteProps<T>) {
    return (
        <div
            className={b(null, className)}
            style={{gridTemplateColumns: `repeat(${columns}, auto)`}}
        >
            {items.map((item, index) => {
                const isSelected = item.value === value;
                const isLastRow = index >= items.length - columns;

                return (
                    <Tooltip
                        key={item.value}
                        openDelay={200}
                        placement={isLastRow ? 'bottom' : 'top'}
                        content={item.title}
                    >
                        <button
                            type="button"
                            className={spacing({p: 1}, b('item'))}
                            aria-label={item.title}
                            aria-pressed={isSelected}
                            onClick={() => onSelect(item.value)}
                            // Parent Menu.Item listens for Enter/Space and re-opens its popup,
                            // shadowing the button's native activation. Handle the keys here
                            // and stop propagation so the swatch is actually selected.
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelect(item.value);
                                }
                            }}
                        >
                            <span className={b('swatch')}>
                                {item.swatch}
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
}

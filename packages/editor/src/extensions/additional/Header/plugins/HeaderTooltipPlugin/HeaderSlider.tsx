import {useState} from 'react';

import {Popup, type PopupPlacement, Slider} from '@gravity-ui/uikit';

import {cn} from 'src/classname';

import './HeaderSlider.scss';

const b = cn('md-header-slider');
const placement: PopupPlacement = ['bottom-start', 'top-start'];

export type HeaderSliderProps = {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    /** Подпись текущего значения: градусы у угла, пиксели у шага. */
    format: (value: number) => string;
    anchorElement: HTMLElement | null;
    hide: () => void;
    onUpdate: (value: number) => void;
};

/**
 * Пока ползунок тянут, значение живёт в локальном состоянии: тулбар мемоизирован
 * и не перерисует поповер по транзакции, поэтому подпись берётся не из ноды.
 */
export function HeaderSlider({
    label,
    value,
    min,
    max,
    step,
    format,
    anchorElement,
    hide,
    onUpdate,
}: HeaderSliderProps) {
    const [current, setCurrent] = useState(value);

    return (
        <Popup open anchorElement={anchorElement} onOpenChange={hide} placement={placement}>
            <div className={b()}>
                <div className={b('label')}>
                    <span>{label}</span>
                    <span className={b('value')}>{format(current)}</span>
                </div>
                <Slider
                    value={current}
                    min={min}
                    max={max}
                    step={step}
                    tooltipDisplay="off"
                    aria-label={label}
                    onUpdate={(next) => {
                        setCurrent(next);
                        onUpdate(next);
                    }}
                />
            </div>
        </Popup>
    );
}

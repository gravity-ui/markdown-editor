import {useState} from 'react';

import {Popup, type PopupPlacement, SegmentedRadioGroup} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import {HEADER_FILLS, HeaderAttr, type HeaderFillValue} from '../../HeaderSpecs';

import './HeaderPalette.scss';

const b = cn('header-palette');
const placement: PopupPlacement = ['bottom-start', 'top-start'];

const FILL_LABEL: Record<HeaderFillValue, () => string> = {
    blue: () => i18n('color_blue'),
    indigo: () => i18n('color_indigo'),
    purple: () => i18n('color_purple'),
    violet: () => i18n('color_violet'),
    teal: () => i18n('color_teal'),
    green: () => i18n('color_green'),
    sky: () => i18n('color_sky'),
    amber: () => i18n('color_amber'),
    yellow: () => i18n('color_yellow'),
    sand: () => i18n('color_sand'),
    red: () => i18n('color_red'),
    navy: () => i18n('color_navy'),
};

export type HeaderFillAttr = typeof HeaderAttr.Fill | typeof HeaderAttr.Fill2;

export type HeaderPaletteProps = {
    value: HeaderFillValue;
    /** Второй цвет задан у градиента и меша; без него палитра правит только заливку. */
    secondValue?: HeaderFillValue;
    anchorElement: HTMLElement | null;
    hide: () => void;
    onPick: (attr: HeaderFillAttr, fill: HeaderFillValue) => void;
};

/** Какой из двух цветов правится — состояние поповера, в документе его нет. */
export function HeaderPalette({
    value,
    secondValue,
    anchorElement,
    hide,
    onPick,
}: HeaderPaletteProps) {
    const [attr, setAttr] = useState<HeaderFillAttr>(HeaderAttr.Fill);
    const target = attr === HeaderAttr.Fill2 && secondValue ? secondValue : value;

    return (
        <Popup open anchorElement={anchorElement} onOpenChange={hide} placement={placement}>
            <div className={b()}>
                {secondValue && (
                    <SegmentedRadioGroup
                        size="s"
                        width="max"
                        value={attr}
                        aria-label={i18n('color')}
                        options={[
                            {
                                value: HeaderAttr.Fill,
                                content: (
                                    <span className={b('slot')}>
                                        <span className={b('swatch')} data-fill={value} />
                                        {i18n('color_first')}
                                    </span>
                                ),
                            },
                            {
                                value: HeaderAttr.Fill2,
                                content: (
                                    <span className={b('slot')}>
                                        <span className={b('swatch')} data-fill={secondValue} />
                                        {i18n('color_second')}
                                    </span>
                                ),
                            },
                        ]}
                        onUpdate={setAttr}
                    />
                )}
                <div className={b('grid')} role="group" aria-label={i18n('color')}>
                    {HEADER_FILLS.map((fill) => (
                        <button
                            key={fill}
                            type="button"
                            className={b('option')}
                            aria-label={FILL_LABEL[fill]()}
                            aria-pressed={fill === target}
                            title={FILL_LABEL[fill]()}
                            onClick={() => {
                                onPick(attr, fill);
                                hide();
                            }}
                        >
                            <span className={b('swatch')} data-fill={fill} />
                        </button>
                    ))}
                </div>
            </div>
        </Popup>
    );
}

import {Palette, Popup, type PopupPlacement} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import {HEADER_FILLS, type HeaderFillValue} from '../../HeaderSpecs';

import './HeaderPalette.scss';

const b = cn('md-header-palette');
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

export type HeaderPaletteProps = {
    value: HeaderFillValue;
    anchorElement: HTMLElement | null;
    hide: () => void;
    onPick: (fill: HeaderFillValue) => void;
};

export function HeaderPalette({value, anchorElement, hide, onPick}: HeaderPaletteProps) {
    return (
        <Popup open anchorElement={anchorElement} onOpenChange={hide} placement={placement}>
            <Palette
                className={b()}
                aria-label={i18n('color')}
                multiple={false}
                columns={4}
                value={[value]}
                options={HEADER_FILLS.map((fill) => ({
                    value: fill,
                    title: FILL_LABEL[fill](),
                    content: <span className={b('swatch')} data-fill={fill} />,
                }))}
                onUpdate={([fill]) => {
                    if (fill) onPick(fill as HeaderFillValue);
                    hide();
                }}
            />
        </Popup>
    );
}

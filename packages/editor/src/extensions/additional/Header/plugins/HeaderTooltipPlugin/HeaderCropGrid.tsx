import {Palette, Popup, type PopupPlacement} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import {HeaderCrop, type HeaderCropValue} from '../../HeaderSpecs';

import './HeaderCropGrid.scss';

const b = cn('md-header-crop');
const placement: PopupPlacement = ['bottom-start', 'top-start'];

/** Порядок задаёт сетку 3 × 3: строки сверху вниз, значения слева направо. */
const CROP_GRID: readonly HeaderCropValue[] = [
    HeaderCrop.TopLeft,
    HeaderCrop.Top,
    HeaderCrop.TopRight,
    HeaderCrop.Left,
    HeaderCrop.Center,
    HeaderCrop.Right,
    HeaderCrop.BottomLeft,
    HeaderCrop.Bottom,
    HeaderCrop.BottomRight,
];

const CROP_LABEL: Record<HeaderCropValue, () => string> = {
    center: () => i18n('crop_center'),
    top: () => i18n('crop_top'),
    right: () => i18n('crop_right'),
    bottom: () => i18n('crop_bottom'),
    left: () => i18n('crop_left'),
    'top-left': () => i18n('crop_top_left'),
    'top-right': () => i18n('crop_top_right'),
    'bottom-right': () => i18n('crop_bottom_right'),
    'bottom-left': () => i18n('crop_bottom_left'),
};

export type HeaderCropGridProps = {
    value: HeaderCropValue;
    anchorElement: HTMLElement | null;
    hide: () => void;
    onPick: (crop: HeaderCropValue) => void;
};

export function HeaderCropGrid({value, anchorElement, hide, onPick}: HeaderCropGridProps) {
    return (
        <Popup open anchorElement={anchorElement} onOpenChange={hide} placement={placement}>
            <Palette
                className={b()}
                aria-label={i18n('image_crop')}
                multiple={false}
                columns={3}
                value={[value]}
                options={CROP_GRID.map((crop) => ({
                    value: crop,
                    title: CROP_LABEL[crop](),
                    content: <span className={b('cell')} data-crop={crop} />,
                }))}
                onUpdate={([crop]) => {
                    if (crop) onPick(crop as HeaderCropValue);
                    hide();
                }}
            />
        </Popup>
    );
}

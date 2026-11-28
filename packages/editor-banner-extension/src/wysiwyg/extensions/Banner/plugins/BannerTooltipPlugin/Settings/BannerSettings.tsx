import {useMemo, useRef} from 'react';

import {shift, size} from '@floating-ui/react';
import {
    type BannerDimensions,
    type BannerHeight,
    type BannerLayout,
    type BannerWidth,
    bannerHeights,
    bannerWidths,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../../i18n';
import {PopupLayer} from '../../../../../components/PopupLayer';
import {SettingsDialog, cnBannerSettings} from '../../../../../components/settings';

import type {BackgroundControls} from './BackgroundField';
import {DimensionSelect} from './DimensionSelect';
import {type ContentControls, SettingsFields} from './SettingsFields';

import './BannerSettings.scss';

const PANEL_INSET = 16;
// The title and both dimension selects stay visible.
const PANEL_MIN_HEIGHT = 160;
const PANEL_MAX_HEIGHT = 720;

const middlewares = [
    size({
        padding: PANEL_INSET,
        apply: ({availableHeight, elements}) => {
            const height = Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, availableHeight));
            elements.floating.style.setProperty('--g-md-banner-settings-max-height', `${height}px`);
        },
    }),
    shift({padding: PANEL_INSET, crossAxis: true}),
];

const heightLabel = (height: BannerHeight) => height.toUpperCase();
const widthLabel = (width: BannerWidth) =>
    width === 'full' ? i18n('full-width') : width.toUpperCase();

type BannerSettingsProps = {
    editor: HTMLElement;
    onLayer: (layer: HTMLDivElement | null) => void;
    /** Receives focus when the panel closes. */
    button: HTMLElement | null;
    dimensions: BannerDimensions;
    onChange: <K extends keyof BannerDimensions>(name: K, value: BannerDimensions[K]) => void;
    layout: BannerLayout;
    onLayoutChange: <K extends keyof BannerLayout>(name: K, value: BannerLayout[K]) => void;
    content: ContentControls;
    background: BackgroundControls;
    onClose: () => void;
};

export function BannerSettings({
    editor,
    onLayer,
    button,
    dimensions,
    onChange,
    layout,
    onLayoutChange,
    content,
    background,
    onClose,
}: BannerSettingsProps) {
    const anchorElement = useMemo(
        () => ({
            contextElement: editor,
            getBoundingClientRect: () => {
                const {x, y, width} = editor.getBoundingClientRect();
                return new DOMRect(x, y, width, 0);
            },
        }),
        [editor],
    );
    const heightRef = useRef<HTMLButtonElement>(null);
    return (
        <PopupLayer raised onLayer={onLayer}>
            <SettingsDialog
                title={i18n('title')}
                className={cnBannerSettings()}
                qa="banner-settings"
                closeSize="l"
                closeAnchor={button}
                onClose={onClose}
                anchorElement={anchorElement}
                placement="bottom-end"
                floatingMiddlewares={middlewares}
                initialFocus={heightRef}
                returnFocus={{current: button}}
            >
                <DimensionSelect
                    controlRef={heightRef}
                    label={i18n('height')}
                    value={dimensions.height}
                    values={bannerHeights}
                    format={heightLabel}
                    onUpdate={(value) => onChange('height', value)}
                />
                <DimensionSelect
                    label={i18n('width')}
                    value={dimensions.width}
                    values={bannerWidths}
                    format={widthLabel}
                    onUpdate={(value) => onChange('width', value)}
                />
                <SettingsFields
                    layout={layout}
                    onLayoutChange={onLayoutChange}
                    content={content}
                    background={background}
                />
            </SettingsDialog>
        </PopupLayer>
    );
}

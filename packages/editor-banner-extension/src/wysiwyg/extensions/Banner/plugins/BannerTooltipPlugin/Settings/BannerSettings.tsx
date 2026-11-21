import {useMemo, useRef} from 'react';

import {limitShift, offset, shift, size} from '@floating-ui/react';
import {type BannerModel, bannerHeights, bannerWidths} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../../i18n';
import {nodeAnchor} from '../../../../popup';
import {SettingsDialog, cnBannerSettings} from '../../../../settings';

import type {BackgroundControls} from './BackgroundField';
import {DimensionSelect} from './DimensionSelect';
import {type ContentControls, SettingsFields} from './SettingsFields';

import './BannerSettings.scss';

const PANEL_OFFSET = 4;
const PANEL_INSET = 16;
const PANEL_MIN_HEIGHT = 160;
const PANEL_MAX_HEIGHT = 720;

const middlewares = [
    offset(PANEL_OFFSET),
    size({
        padding: PANEL_INSET,
        apply: ({availableHeight, elements}) => {
            const height = Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, availableHeight));
            elements.floating.style.setProperty('--g-md-banner-settings-max-height', `${height}px`);
        },
    }),
    shift({padding: PANEL_INSET, crossAxis: true, limiter: limitShift()}),
];

type BannerSettingsProps = {
    block: HTMLElement | null;
    button: HTMLElement | null;
    model: BannerModel;
    onChange: (changes: Partial<BannerModel>) => void;
    content: ContentControls;
    background: BackgroundControls;
    onClose: () => void;
};

export function BannerSettings({
    block,
    button,
    model,
    onChange,
    content,
    background,
    onClose,
}: BannerSettingsProps) {
    const heightRef = useRef<HTMLButtonElement>(null);
    const handleHeightUpdate = (height: BannerModel['height']) => onChange({height});
    const handleWidthUpdate = (width: BannerModel['width']) => onChange({width});
    const anchorElement = useMemo(() => block && nodeAnchor(block), [block]);
    return (
        <SettingsDialog
            title={i18n('title')}
            className={cnBannerSettings()}
            qa="banner-settings"
            closeSize="l"
            closeAnchor={button}
            anchorElement={anchorElement}
            placement="right-start"
            floatingMiddlewares={middlewares}
            initialFocus={heightRef}
            returnFocus={{current: button}}
            onClose={onClose}
        >
            <DimensionSelect
                controlRef={heightRef}
                label={i18n('height')}
                value={model.height}
                values={bannerHeights}
                format={(value) => value.toUpperCase()}
                onUpdate={handleHeightUpdate}
            />
            <DimensionSelect
                label={i18n('width')}
                value={model.width}
                values={bannerWidths}
                format={(value) => (value === 'full' ? i18n('full-width') : value.toUpperCase())}
                onUpdate={handleWidthUpdate}
            />
            <SettingsFields
                model={model}
                onChange={onChange}
                content={content}
                background={background}
            />
        </SettingsDialog>
    );
}

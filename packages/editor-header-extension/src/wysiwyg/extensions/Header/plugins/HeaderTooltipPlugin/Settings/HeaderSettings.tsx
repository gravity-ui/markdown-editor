import {useMemo, useRef} from 'react';

import {limitShift, shift, size} from '@floating-ui/react';
import {
    type HeaderDimensions,
    headerHeights,
    headerWidths,
} from '@gravity-ui/markdown-plugin-header';
import type {PopupAnchorElement} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {SettingsDialog, cnHeaderSettings} from '../../../../settings';

import {DimensionSelect} from './DimensionSelect';
import {SettingsFields} from './SettingsFields';

import './HeaderSettings.scss';

const PANEL_INSET = 16;
// The title and both dimension selects stay visible.
const PANEL_MIN_HEIGHT = 160;
const PANEL_MAX_HEIGHT = 720;

// `limitShift` keeps the panel over the anchor, so the anchor spans the block width.
const insideTopEdge = (block: HTMLElement): PopupAnchorElement => ({
    contextElement: block,
    getBoundingClientRect: () => {
        const {top, left, width} = block.getBoundingClientRect();
        return new DOMRect(left + PANEL_INSET, top + PANEL_INSET, width - 2 * PANEL_INSET, 0);
    },
});

// Replace the Popup defaults, so the panel stays in the corner instead of flipping.
// It ends `PANEL_INSET` px above the viewport bottom; at `PANEL_MIN_HEIGHT` it moves up instead.
const middlewares = [
    size({
        padding: PANEL_INSET,
        apply: ({availableHeight, elements}) => {
            const height = Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, availableHeight));
            elements.floating.style.setProperty('--g-md-header-settings-max-height', `${height}px`);
        },
    }),
    shift({padding: PANEL_INSET, crossAxis: true, limiter: limitShift()}),
];

type HeaderSettingsProps = {
    /** The panel opens inside this banner, at its top right corner. */
    block: HTMLElement | null;
    /** Receives focus when the panel closes. */
    button: HTMLElement | null;
    dimensions: HeaderDimensions;
    onChange: <K extends keyof HeaderDimensions>(name: K, value: HeaderDimensions[K]) => void;
    onClose: () => void;
};

export function HeaderSettings({
    block,
    button,
    dimensions,
    onChange,
    onClose,
}: HeaderSettingsProps) {
    const anchorElement = useMemo(() => block && insideTopEdge(block), [block]);
    const heightRef = useRef<HTMLButtonElement>(null);
    return (
        <SettingsDialog
            title={i18n('title')}
            className={cnHeaderSettings()}
            qa="header-settings"
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
                values={headerHeights}
                format={(value) => value.toUpperCase()}
                onUpdate={(value) => onChange('height', value)}
            />
            <DimensionSelect
                label={i18n('width')}
                value={dimensions.width}
                values={headerWidths}
                format={(value) => (value === 'full' ? i18n('full-width') : value.toUpperCase())}
                onUpdate={(value) => onChange('width', value)}
            />
            <SettingsFields />
        </SettingsDialog>
    );
}

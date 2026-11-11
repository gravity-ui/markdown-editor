import {type CSSProperties, useLayoutEffect, useMemo, useRef, useState} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {
    type HeaderDimensions,
    headerHeights,
    headerWidths,
} from '@gravity-ui/markdown-plugin-header';
import {Button, Icon, Popup, type PopupAnchorElement, Text, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';

import {DimensionSelect} from './DimensionSelect';
import {SettingsFields} from './SettingsFields';

import './HeaderSettings.scss';

const b = cn('header-settings');

const PANEL_INSET = 16;
const CLOSE_ICON_SIZE = 16;

// The Popup keeps at least 4 px of the panel over the anchor, so the anchor spans the block width.
const insideTopEdge = (block: HTMLElement): PopupAnchorElement => ({
    contextElement: block,
    getBoundingClientRect: () => {
        const {top, left, width} = block.getBoundingClientRect();
        return new DOMRect(left + PANEL_INSET, top + PANEL_INSET, width - 2 * PANEL_INSET, 0);
    },
});

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
    const titleId = useUniqId();
    const anchorElement = useMemo(() => block && insideTopEdge(block), [block]);
    const heightRef = useRef<HTMLButtonElement>(null);
    const [availableSize, setAvailableSize] = useState<{width: number; height: number}>();

    useLayoutEffect(() => {
        if (!block) return undefined;
        const controller = new AbortController();
        let frame: number | undefined;
        const updateSize = () => {
            frame = undefined;
            const width = Math.max(0, window.innerWidth - 2 * PANEL_INSET);
            const height = Math.max(
                0,
                window.innerHeight - block.getBoundingClientRect().top - 2 * PANEL_INSET,
            );
            setAvailableSize((previous) =>
                previous?.width === width && previous.height === height
                    ? previous
                    : {width, height},
            );
        };
        const scheduleUpdate = () => {
            if (frame === undefined) frame = requestAnimationFrame(updateSize);
        };
        const onScroll = (event: Event) => {
            // Only ancestor scrolling can move the banner's anchor.
            if (event.target instanceof Node && event.target.contains(block)) scheduleUpdate();
        };
        updateSize();
        const observer = new ResizeObserver(scheduleUpdate);
        observer.observe(block);
        window.addEventListener('resize', scheduleUpdate, {signal: controller.signal});
        window.addEventListener('scroll', onScroll, {capture: true, signal: controller.signal});
        return () => {
            controller.abort();
            observer.disconnect();
            if (frame !== undefined) cancelAnimationFrame(frame);
        };
    }, [block]);

    return (
        <Popup
            open
            anchorElement={anchorElement}
            // Without fallback placements, the panel stays in the corner.
            placement={['bottom-end']}
            offset={0}
            // Focus set before the panel is positioned skips `returnFocus`.
            initialFocus={heightRef}
            returnFocus={{current: button}}
            onOpenChange={(open, event, reason) => {
                // The settings button toggles the panel on its own click.
                const onButton =
                    reason === 'outside-press' &&
                    event?.target instanceof Node &&
                    button?.contains(event.target);
                if (!open && !onButton) onClose();
            }}
        >
            <section
                className={b()}
                style={
                    {
                        '--g-md-header-settings-available-height':
                            availableSize === undefined ? undefined : `${availableSize.height}px`,
                        '--g-md-header-settings-available-width':
                            availableSize === undefined ? undefined : `${availableSize.width}px`,
                    } as CSSProperties
                }
                role="dialog"
                aria-labelledby={titleId}
                data-qa="header-settings"
            >
                <div className={b('title')}>
                    <Text variant="subheader-3" id={titleId}>
                        {i18n('title')}
                    </Text>
                    <Button view="flat" size="l" aria-label={i18n('close')} onClick={onClose}>
                        <Icon data={Xmark} size={CLOSE_ICON_SIZE} />
                    </Button>
                </div>
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
                    format={(value) =>
                        value === 'full' ? i18n('full-width') : value.toUpperCase()
                    }
                    onUpdate={(value) => onChange('width', value)}
                />
                <SettingsFields />
            </section>
        </Popup>
    );
}

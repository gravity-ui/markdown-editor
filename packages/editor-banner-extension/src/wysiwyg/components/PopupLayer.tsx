import {type ReactNode, useCallback, useMemo, useState} from 'react';

import {cn} from '@gravity-ui/markdown-editor';
import {Portal, PortalProvider} from '@gravity-ui/uikit';

import './PopupLayer.scss';

const b = cn('banner-popup-layer');

type PopupLayerProps = {
    raised?: boolean;
    onLayer?: (layer: HTMLDivElement | null) => void;
    children: ReactNode;
};

export function PopupLayer({raised, onLayer, children}: PopupLayerProps) {
    const [layer, setLayer] = useState<HTMLDivElement | null>(null);
    const container = useMemo(() => ({current: layer}), [layer]);
    const layerRef = useCallback(
        (node: HTMLDivElement | null) => {
            setLayer(node);
            onLayer?.(node);
        },
        [onLayer],
    );
    return (
        <Portal>
            <div ref={layerRef} className={b({raised})}>
                {layer && <PortalProvider container={container}>{children}</PortalProvider>}
            </div>
        </Portal>
    );
}

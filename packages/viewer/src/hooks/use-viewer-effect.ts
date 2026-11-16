import {type DependencyList, useContext, useState} from 'react';

import {ViewerContext} from '../lifecycle/context';
import type {ViewerEffect} from '../lifecycle/types';
import {useClientLayoutEffect} from '../utils/use-client-layout-effect';

export function useViewerEffect(setup: ViewerEffect, dependencies: DependencyList): void {
    const lifecycle = useContext(ViewerContext);
    const [key] = useState(() => Symbol());

    if (!lifecycle) throw new Error('useViewerEffect must be used inside MarkdownViewer');

    useClientLayoutEffect(() => () => lifecycle.remove(key), [lifecycle, key]);

    useClientLayoutEffect(() => {
        lifecycle.update(key, setup, dependencies);
    });
}

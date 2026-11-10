import {lazy} from 'react';

export type {YFMPageConstructorRendererProps} from './YFMPageConstructorRenderer';

export const YFMPageConstructorRendererLazy = lazy(() =>
    import(/* webpackChunkName: "yfm-page-constructor" */ './YFMPageConstructorRenderer.js').then(
        (module) => ({
            default: module.YFMPageConstructorRenderer,
        }),
    ),
);

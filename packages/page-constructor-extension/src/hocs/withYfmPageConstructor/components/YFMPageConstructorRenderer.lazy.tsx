import {lazy} from 'react';

export type {YFMPageConstructorRendererProps} from './YFMPageConstructorRenderer';

export const YFMPageConstructorRendererLazy = lazy(() =>
    // @ts-ignore error TS2835: Relative import paths need explicit file extensions in ECMAScript (cjs build)
    import(/* webpackChunkName: "yfm-page-constructor" */ './YFMPageConstructorRenderer').then(
        (module) => ({
            default: module.YFMPageConstructorRenderer,
        }),
    ),
);

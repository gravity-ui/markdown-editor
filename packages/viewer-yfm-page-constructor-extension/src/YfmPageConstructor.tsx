import {Suspense, lazy} from 'react';

import {ViewerTargets} from '@gravity-ui/markdown-viewer';
import type {Theme} from '@gravity-ui/page-constructor';
import {Flex, Text} from '@gravity-ui/uikit';
import {ErrorBoundary, type FallbackProps} from 'react-error-boundary';

export type YfmPageConstructorRuntime = string | {script: string; style: string};

export interface YfmPageConstructorProps {
    /** Transform metadata. Blocks render when the script name matches. */
    meta?: {script?: string[]; style?: string[]};
    /** Script name or transform asset pair. Matches `meta.script`. Defaults to `_assets/page-constructor.js`. */
    runtime?: YfmPageConstructorRuntime;
    /** Block selector inside the viewer. Defaults to `.yfm-page-constructor`. */
    selector?: string;
    /** Defaults to the light or dark variant of the current UIKit theme. */
    theme?: Theme;
    /** Handle block loading and rendering errors. Defaults to `console.error`. */
    onError?: (error: Error) => void;
}

// TODO: Use single quotes once gulp-utils keeps webpackChunkName on local imports.
const PageConstructorContent = lazy(() =>
    import(/* webpackChunkName: "viewer-page-constructor" */ `./YfmPageConstructorContent.js`).then(
        (module) => ({default: module.YfmPageConstructorContent}),
    ),
);

export function YfmPageConstructor({
    meta,
    runtime = '_assets/page-constructor.js',
    selector = '.yfm-page-constructor',
    theme,
    onError = console.error,
}: YfmPageConstructorProps) {
    const script = typeof runtime === 'string' ? runtime : runtime.script;
    if (!meta?.script?.includes(script)) return null;

    return (
        <ViewerTargets selector={selector} as="div">
            {(host) => (
                <ErrorBoundary fallbackRender={renderError} onError={(error) => onError(error)}>
                    <Suspense>
                        <PageConstructorContent host={host} theme={theme} />
                    </Suspense>
                </ErrorBoundary>
            )}
        </ViewerTargets>
    );
}

function renderError({error}: FallbackProps) {
    return (
        <Flex justifyContent="center" alignItems="center">
            <Text variant="body-1" color="danger">
                {error.message}
            </Text>
        </Flex>
    );
}

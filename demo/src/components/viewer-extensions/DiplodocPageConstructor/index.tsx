import {Suspense, lazy} from 'react';

import {ViewerTargets} from '@gravity-ui/markdown-viewer';
import type {Theme} from '@gravity-ui/page-constructor';
import {Flex, Text} from '@gravity-ui/uikit';
import {ErrorBoundary, type FallbackProps} from 'react-error-boundary';

import type {DiplodocPageConstructorRuntime, TransformMeta} from '../types';

interface DiplodocPageConstructorProps {
    meta?: TransformMeta;
    runtime?: DiplodocPageConstructorRuntime;
    selector?: string;
    theme?: Theme;
    onError?: (error: Error) => void;
}

const PageConstructorContent = lazy(() =>
    import(
        /* webpackChunkName: "viewer-page-constructor" */ './DiplodocPageConstructorContent'
    ).then((module) => ({default: module.DiplodocPageConstructorContent})),
);

export function DiplodocPageConstructor({
    meta,
    runtime = '_assets/page-constructor.js',
    selector = '.yfm-page-constructor',
    theme,
    onError = console.error,
}: DiplodocPageConstructorProps) {
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

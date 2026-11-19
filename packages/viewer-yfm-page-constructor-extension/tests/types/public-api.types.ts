import {type ReactElement, createElement} from 'react';

import {Theme} from '@gravity-ui/page-constructor';

import {
    YfmPageConstructor,
    type YfmPageConstructorProps,
    type YfmPageConstructorRuntime,
} from '@gravity-ui/markdown-viewer-yfm-page-constructor-extension';

export function shouldAcceptCustomPageConstructorSettings() {
    const runtime: YfmPageConstructorRuntime = {script: 'custom.js', style: 'custom.css'};
    const props: YfmPageConstructorProps = {
        meta: {script: [runtime.script]},
        runtime,
        selector: '.custom-block',
        theme: Theme.Dark,
        onError(error: Error) {
            console.error(error.message);
        },
    };
    const element: ReactElement<YfmPageConstructorProps> = createElement(YfmPageConstructor, props);
    return element;
}

export function shouldRejectRuntimeWithoutScript() {
    // @ts-expect-error The runtime needs a script name to match against metadata.
    const runtime: YfmPageConstructorRuntime = {style: 'custom.css'};
    return runtime;
}

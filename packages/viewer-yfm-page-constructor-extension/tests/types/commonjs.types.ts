import {type ReactElement, createElement} from 'react';

import type {
    YfmPageConstructor,
    YfmPageConstructorProps,
    YfmPageConstructorRuntime,
} from '@gravity-ui/markdown-viewer-yfm-page-constructor-extension' with {
    'resolution-mode': 'require',
};

export function shouldExposeCommonJsDeclarations(component: typeof YfmPageConstructor) {
    const runtime: YfmPageConstructorRuntime = 'custom.js';
    const props: YfmPageConstructorProps = {meta: {script: [runtime]}, runtime};
    const element: ReactElement<YfmPageConstructorProps> = createElement(component, props);
    return element;
}

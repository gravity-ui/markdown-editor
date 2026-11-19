import {createElement} from 'react';

import type {
    YfmLatex,
    YfmLatexOptions,
    YfmLatexProps,
    YfmLatexRuntime,
} from '@gravity-ui/markdown-viewer-yfm-latex-extension' with {'resolution-mode': 'require'};

export function shouldAcceptCommonJsDeclarations(component: typeof YfmLatex) {
    const runtime: YfmLatexRuntime = 'latex';
    const options: YfmLatexOptions = {throwOnError: false};
    const props: YfmLatexProps = {meta: {script: ['latex']}, runtime, options};
    return createElement(component, props);
}

export function shouldRejectCommonJsExternalTargets() {
    const options: YfmLatexOptions = {
        // @ts-expect-error The viewer owns the render targets.
        nodes: [],
    };
    return options;
}

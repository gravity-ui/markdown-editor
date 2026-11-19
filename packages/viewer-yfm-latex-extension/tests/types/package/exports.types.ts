import {createElement} from 'react';

import {
    YfmLatex,
    type YfmLatexOptions,
    type YfmLatexProps,
    type YfmLatexRuntime,
} from '@gravity-ui/markdown-viewer-yfm-latex-extension';

export function shouldAcceptPublishedProps() {
    const runtime: YfmLatexRuntime = {script: 'latex.js', style: 'latex.css'};
    const options: YfmLatexOptions = {throwOnError: false, sanitize: (content) => content};
    const props: YfmLatexProps = {
        meta: {script: ['latex.js'], style: ['latex.css']},
        runtime,
        options,
        selector: '.formula',
        onError(error) {
            const value: unknown = error;
            return value;
        },
    };
    return createElement(YfmLatex, props);
}

export function shouldRejectPublishedExternalTargets() {
    const props: YfmLatexProps = {
        options: {
            // @ts-expect-error The viewer owns the render targets.
            nodes: [],
        },
    };
    return props;
}

export function shouldRejectPublishedDocumentSelectors() {
    const options: YfmLatexOptions = {
        // @ts-expect-error Use the viewer-scoped selector prop.
        querySelector: '.formula',
    };
    return options;
}

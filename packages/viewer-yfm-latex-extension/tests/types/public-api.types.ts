import {type ReactElement, createElement} from 'react';

import {YfmLatex, type YfmLatexOptions, type YfmLatexProps, type YfmLatexRuntime} from '../../src';

export function shouldAcceptDefaultProps() {
    const element: ReactElement<YfmLatexProps> = createElement(YfmLatex, {});
    return element;
}

export function shouldAcceptRuntimePaths() {
    const shared: YfmLatexRuntime = 'latex';
    const separate: YfmLatexRuntime = {script: 'latex.js', style: 'latex.css'};
    const props: YfmLatexProps[] = [{runtime: shared}, {runtime: separate}];
    return props;
}

export function shouldAcceptRenderingOptions() {
    const options: YfmLatexOptions = {
        displayMode: true,
        throwOnError: false,
        errorColor: 'red',
        strict: 'warn',
        trust: false,
        macros: {'\\R': '\\mathbb{R}'},
        sanitize: (content) => content,
    };
    const props: YfmLatexProps = {
        meta: {script: ['latex.js'], style: ['latex.css']},
        selector: '.formula',
        options,
        onError(error) {
            const value: unknown = error;
            return value;
        },
    };
    return createElement(YfmLatex, props);
}

export function shouldRejectExternalNodes() {
    const options: YfmLatexOptions = {
        // @ts-expect-error The viewer owns the render targets.
        nodes: [],
    };
    return options;
}

export function shouldRejectDocumentSelectors() {
    const options: YfmLatexOptions = {
        // @ts-expect-error Use the viewer-scoped selector prop.
        querySelector: '.formula',
    };
    return options;
}

export function shouldRejectIncompleteRuntimePaths() {
    // @ts-expect-error Separate runtime paths need both script and style.
    const runtime: YfmLatexRuntime = {script: 'latex.js'};
    return runtime;
}

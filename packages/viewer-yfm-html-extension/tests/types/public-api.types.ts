import {type ReactElement, createElement} from 'react';

import {
    YfmHtmlBlock,
    type YfmHtmlBlockProps,
    type YfmHtmlBlockRuntime,
    type YfmHtmlRuntimeConfig,
    toIframeCssVariables,
} from '@gravity-ui/markdown-viewer-yfm-html-extension';

export function shouldAcceptIframeConfiguration() {
    const runtime: YfmHtmlBlockRuntime = 'custom-html.js';
    const runtimeConfig: YfmHtmlRuntimeConfig = {disabledModes: ['shadow']};
    const styles: Record<string, string> = toIframeCssVariables({fontSize: '16px'});
    const props: YfmHtmlBlockProps = {
        meta: {script: [runtime]},
        runtime,
        runtimeConfig,
        config: {classNames: ['dark'], styles},
    };
    const element: ReactElement<YfmHtmlBlockProps> = createElement(YfmHtmlBlock, props);
    return element;
}

export function shouldRejectUnknownEmbeddingModes() {
    const props: YfmHtmlBlockProps = {
        // @ts-expect-error Diplodoc accepts only its supported modes.
        runtimeConfig: {disabledModes: ['other']},
    };
    return props;
}

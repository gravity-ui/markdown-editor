import React, {ComponentType, RefAttributes, forwardRef, useEffect} from 'react';

import {useDiplodocHtml} from '@diplodoc/html-extension/react';
import {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';

import type {PluginRuntime, TransformMeta} from '../withMermaid/types';

import {useYfmHtmlBlockRuntime} from './useYfmHtmlBlockRuntime';

export type WithYfmHtmlBlockOptions = {
    runtime: PluginRuntime;
};

export type WithYfmHtmlBlockProps = {
    meta: TransformMeta;
    yfmHtmlBlockConfig?: IHTMLIFrameElementConfig;
};

export function withYfmHtmlBlock(opts: WithYfmHtmlBlockOptions) {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithYfmHtmlBlockProps>(function WithYfmHtml(props, ref) {
            const {meta, html, yfmHtmlBlockConfig} = props;

            useYfmHtmlBlockRuntime(meta, opts.runtime);

            const yfmHtmlBlock = useDiplodocHtml();

            useEffect(() => {
                if (yfmHtmlBlock) {
                    if (yfmHtmlBlockConfig) {
                        yfmHtmlBlock.setConfig(yfmHtmlBlockConfig);
                    }
                    yfmHtmlBlock.reinitialize();
                }
            }, [yfmHtmlBlock, html, yfmHtmlBlockConfig]);

            return <Component {...props} ref={ref} />;
        });
}

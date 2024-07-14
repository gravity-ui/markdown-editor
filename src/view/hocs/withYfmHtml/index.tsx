import React, {ComponentType, RefAttributes, forwardRef, useEffect} from 'react';

import {useDiplodocHtml} from '@diplodoc/html-extension/react';

import {IHTMLIFrameElementConfig} from '../../../extensions';

import {useYfmHtmlBlockRuntime} from './useYfmHtmlBlockRuntime';

export type WithYfmHtmlBlockProps = {
    yfmHtmlBlockConfig?: IHTMLIFrameElementConfig;
};

export function withYfmHtmlBlock() {
    return <T extends {html: string}>(
        Component: ComponentType<T & RefAttributes<HTMLDivElement>>,
    ) =>
        forwardRef<HTMLDivElement, T & WithYfmHtmlBlockProps>(function WithYfmHtml(props, ref) {
            const {html, yfmHtmlBlockConfig} = props;

            useYfmHtmlBlockRuntime();

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

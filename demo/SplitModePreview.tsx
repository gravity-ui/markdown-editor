import React, {useEffect, useMemo, useRef, useState} from 'react';

import transform from '@diplodoc/transform';
import {useThemeValue} from '@gravity-ui/uikit';

import {MarkupString, colorClassName} from '../src';
import {debounce} from '../src/lodash';
import {YfmStaticView} from '../src/view/components/YfmHtml';
import {withLatex} from '../src/view/hocs/withLatex';
import {MermaidConfig, withMermaid} from '../src/view/hocs/withMermaid';
import {withYfmHtmlBlock} from '../src/view/hocs/withYfmHtml';

import {LATEX_RUNTIME, MERMAID_RUNTIME, YFM_HTML_BLOCK_RUNTIME} from './constants/md-plugins';
import useYfmHtmlBlockStyles from './hooks/useYfmHtmlBlockStyles';

const ML_ATTR = 'data-ml';
const mermaidConfig: MermaidConfig = {theme: 'forest'};

const Preview = withMermaid({runtime: MERMAID_RUNTIME})(
    withLatex({runtime: LATEX_RUNTIME})(
        withYfmHtmlBlock({runtime: YFM_HTML_BLOCK_RUNTIME})(YfmStaticView),
    ),
);

export type SplitModePreviewProps = {
    plugins?: import('markdown-it').PluginSimple[];
    getValue: () => MarkupString;
    allowHTML?: boolean;
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
    needToSanitizeHtml?: boolean;
};

export const SplitModePreview: React.FC<SplitModePreviewProps> = (props) => {
    const {plugins, getValue, allowHTML, breaks, linkify, linkifyTlds, needToSanitizeHtml} = props;
    const [html, setHtml] = useState('');
    const [meta, setMeta] = useState<object | undefined>({});
    const divRef = useRef<HTMLDivElement>(null);

    const theme = useThemeValue();

    const render = useMemo(
        () =>
            debounce(() => {
                const res = transform(getValue(), {
                    allowHTML,
                    breaks,
                    plugins,
                    linkify,
                    linkifyTlds,
                    needToSanitizeHtml,
                    linkAttrs: [[ML_ATTR, true]],
                    defaultClassName: colorClassName,
                }).result;
                setHtml(res.html);
                setMeta(res.meta);
            }, 200),
        [getValue, allowHTML, breaks, plugins, linkify, linkifyTlds, needToSanitizeHtml, theme],
    );

    useEffect(() => {
        render();
    }, [props, render]);

    const yfmHtmlBlockConfig = useYfmHtmlBlockStyles();

    return (
        <Preview
            ref={divRef}
            html={html}
            meta={meta}
            noListReset
            mermaidConfig={mermaidConfig}
            yfmHtmlBlockConfig={yfmHtmlBlockConfig}
            className="demo-preview"
        />
    );
};

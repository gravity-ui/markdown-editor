import {useEffect, useMemo, useRef, useState} from 'react';

import type {HTMLRuntimeConfig} from '@diplodoc/html-extension';
import transform from '@diplodoc/transform';
import {useThemeValue} from '@gravity-ui/uikit';
import type MarkdownIt from 'markdown-it';

import {type MarkupString, colorClassName} from 'src/index';
import {debounce} from 'src/lodash';
import {YfmStaticView} from 'src/view/components/YfmHtml';
import {withLatex} from 'src/view/hocs/withLatex';
import {type MermaidConfig, withMermaid} from 'src/view/hocs/withMermaid';
import {withYfmHtmlBlock} from 'src/view/hocs/withYfmHtml';

import {LATEX_RUNTIME, MERMAID_RUNTIME, YFM_HTML_BLOCK_RUNTIME} from '../defaults/md-plugins';
import useYfmHtmlBlockStyles from '../hooks/useYfmHtmlBlockStyles';

const ML_ATTR = 'data-ml';
const mermaidConfig: MermaidConfig = {theme: 'forest'};

const Preview = withMermaid({runtime: MERMAID_RUNTIME})(
    withLatex({runtime: LATEX_RUNTIME})(
        withYfmHtmlBlock({runtime: YFM_HTML_BLOCK_RUNTIME})(YfmStaticView),
    ),
);

export type SplitModePreviewProps = {
    plugins: MarkdownIt.PluginSimple[];
    getValue: () => MarkupString;
    allowHTML?: boolean;
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
    needToSanitizeHtml?: boolean;
    htmlRuntimeConfig?: HTMLRuntimeConfig;
    disableMarkdownItAttrs?: boolean;
};

export const SplitModePreview: React.FC<SplitModePreviewProps> = (props) => {
    const {
        plugins,
        getValue,
        allowHTML,
        breaks,
        linkify,
        linkifyTlds,
        needToSanitizeHtml,
        htmlRuntimeConfig,
        disableMarkdownItAttrs,
    } = props;
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
                    linkify,
                    linkifyTlds,
                    needToSanitizeHtml,
                    linkAttrs: [[ML_ATTR, true]],
                    defaultClassName: colorClassName,
                    plugins: [
                        ...plugins,
                        ...(disableMarkdownItAttrs
                            ? [(md: MarkdownIt) => md.core.ruler.disable('curly_attributes')]
                            : []),
                    ],
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
            htmlRuntimeConfig={htmlRuntimeConfig}
            className="demo-preview"
        />
    );
};

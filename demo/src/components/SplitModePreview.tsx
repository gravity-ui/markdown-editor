import {useEffect, useMemo, useRef, useState} from 'react';

import type {HTMLRuntimeConfig} from '@diplodoc/html-extension';
import transform from '@diplodoc/transform';
import {type MarkupString, colorClassName} from '@gravity-ui/markdown-editor';
import {debounce} from '@gravity-ui/markdown-editor/_/lodash.js';
import {YfmStaticView} from '@gravity-ui/markdown-editor/view/components/YfmHtml/index.js';
import {withLatex} from '@gravity-ui/markdown-editor/view/hocs/withLatex/index.js';
import {withYfmHtmlBlock} from '@gravity-ui/markdown-editor/view/hocs/withYfmHtml/index.js';
import {type MermaidConfig, withMermaid} from '@gravity-ui/markdown-editor-mermaid-extension/view';
import {withYfmPageConstructor} from '@gravity-ui/markdown-editor-page-constructor-extension/view';
import {useThemeValue} from '@gravity-ui/uikit';
import type MarkdownIt from 'markdown-it';

import {
    type GetPluginsOptions,
    LATEX_RUNTIME,
    MERMAID_RUNTIME,
    PAGE_CONSTRUCTOR_RUNTIME,
    YFM_HTML_BLOCK_RUNTIME,
    getPlugins,
} from '../defaults/md-plugins';
import useYfmHtmlBlockStyles from '../hooks/useYfmHtmlBlockStyles';

const ML_ATTR = 'data-ml';
const mermaidConfig: MermaidConfig = {theme: 'forest'};

const Preview = withMermaid({runtime: MERMAID_RUNTIME})(
    withLatex({runtime: LATEX_RUNTIME})(
        withYfmPageConstructor({runtime: PAGE_CONSTRUCTOR_RUNTIME})(
            withYfmHtmlBlock({runtime: YFM_HTML_BLOCK_RUNTIME})(YfmStaticView),
        ),
    ),
);

export type SplitModePreviewProps = {
    pluginsOptions?: GetPluginsOptions;
    /** Appended to the default plugin set */
    extraPlugins?: MarkdownIt.PluginSimple[];
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
        pluginsOptions,
        extraPlugins,
        getValue,
        allowHTML,
        breaks,
        linkify,
        linkifyTlds,
        needToSanitizeHtml,
        htmlRuntimeConfig,
        disableMarkdownItAttrs,
    } = props;
    const {
        directiveSyntax,
        table_ignoreSplittersInBlockMath: ignoreSplittersInBlockMath,
        table_ignoreSplittersInInlineMath: ignoreSplittersInInlineMath,
    } = pluginsOptions ?? {};

    // Deps are the option fields, not the options object: callers build it inline on every render,
    // and a new plugin array would recreate `render` and retrigger the transform effect.
    const mdPlugins = useMemo(
        () => [
            ...getPlugins({
                directiveSyntax,
                table_ignoreSplittersInBlockMath: ignoreSplittersInBlockMath,
                table_ignoreSplittersInInlineMath: ignoreSplittersInInlineMath,
            }),
            ...(extraPlugins ?? []),
        ],
        [directiveSyntax, ignoreSplittersInBlockMath, ignoreSplittersInInlineMath, extraPlugins],
    );
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
                        ...mdPlugins,
                        ...(disableMarkdownItAttrs
                            ? [(md: MarkdownIt) => md.core.ruler.disable('curly_attributes')]
                            : []),
                    ],
                }).result;
                setHtml(res.html);
                setMeta(res.meta);
            }, 200),
        [
            getValue,
            allowHTML,
            breaks,
            mdPlugins,
            disableMarkdownItAttrs,
            linkify,
            linkifyTlds,
            needToSanitizeHtml,
            theme,
        ],
    );

    useEffect(() => {
        render();
    }, [props, render]);

    const yfmHtmlBlockConfig = useYfmHtmlBlockStyles();

    return (
        <Preview
            qa="demo-md-preview"
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

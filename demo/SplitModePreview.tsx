import React, {useEffect, useMemo, useRef, useState} from 'react';

import {useDiplodocHtml} from '@diplodoc/html-extension/react';
import transform from '@diplodoc/transform';
import {useThemeValue} from '@gravity-ui/uikit';

import {MarkupString, colorClassName} from '../src';
import {debounce} from '../src/lodash';
import {HtmlView} from '../src/view/components/HtmlView';
import {withLatex} from '../src/view/hocs/withLatex';
import {MermaidConfig, withMermaid} from '../src/view/hocs/withMermaid';
import {withYfmHtml} from '../src/view/hocs/withYfmHtml';

import {LATEX_RUNTIME, MERMAID_RUNTIME} from './md-plugins';

const ML_ATTR = 'data-ml';
const mermaidConfig: MermaidConfig = {theme: 'forest'};

const Preview = withMermaid({runtime: MERMAID_RUNTIME})(
    withLatex({runtime: LATEX_RUNTIME})(withYfmHtml()(HtmlView)),
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

// TODO: export HTMLControllerForEachCallback
type HTMLControllerForEachCallback = any;

export const SplitModePreview: React.FC<SplitModePreviewProps> = (props) => {
    const {plugins, getValue, allowHTML, breaks, linkify, linkifyTlds, needToSanitizeHtml} = props;
    const [html, setHtml] = useState('');
    const [meta, setMeta] = useState<object | undefined>({});
    const divRef = useRef<HTMLDivElement>(null);

    const theme = useThemeValue();
    const yfmHtml = useDiplodocHtml();

    useEffect(() => {
        const bodyStyles = window.getComputedStyle(document.body);
        // TODO: add background style
        const color = bodyStyles.getPropertyValue('--g-color-text-primary');
        const background = bodyStyles.getPropertyValue('--g-color-base-background');

        yfmHtml.forEach((yfmHtmlBlock: HTMLControllerForEachCallback) => {
            yfmHtmlBlock.setStyles({
                // TODO: use css vars
                color,
                background,
            });
        });
    }, [theme, yfmHtml]);

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

    return (
        <Preview
            ref={divRef}
            html={html}
            meta={meta}
            noListReset
            mermaidConfig={mermaidConfig}
            className="demo-preview"
        />
    );
};

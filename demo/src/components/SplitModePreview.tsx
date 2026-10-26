import {useMemo, useState} from 'react';

import '@diplodoc/cut-extension/runtime';
import '@diplodoc/folding-headings-extension/runtime';
import type {HTMLRuntimeConfig} from '@diplodoc/html-extension';
import {buildYfmHtmlBlockOptions} from '@diplodoc/html-extension';
import '@diplodoc/tabs-extension/runtime';
import transform from '@diplodoc/transform';
import {GalleryProvider} from '@gravity-ui/components';
import {type MarkupString, colorClassName} from '@gravity-ui/markdown-editor';
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {
    FilesGallery,
    type FilesGallerySource,
    HeadingAnchors,
    YfmCodeBlockActions,
} from '@gravity-ui/markdown-viewer/extensions';
import {sp} from '@gravity-ui/uikit';
import type MarkdownIt from 'markdown-it';
import {useDebounce} from 'react-use';

import {
    type GetPluginsOptions,
    LATEX_RUNTIME,
    MERMAID_RUNTIME,
    PAGE_CONSTRUCTOR_RUNTIME,
    YFM_HTML_BLOCK_RUNTIME,
    getPlugins,
} from '../defaults/md-plugins';
import useYfmHtmlBlockStyles from '../hooks/useYfmHtmlBlockStyles';
import {DiplodocHtml} from '../stories/viewer/extensions/DiplodocHtml';
import {DiplodocLatex} from '../stories/viewer/extensions/DiplodocLatex';
import {DiplodocMermaid} from '../stories/viewer/extensions/DiplodocMermaid';
import {DiplodocPageConstructor} from '../stories/viewer/extensions/DiplodocPageConstructor';
import type {TransformMeta} from '../stories/viewer/extensions/types';
import {getHeadingHref, navigateToHeading} from '../stories/viewer/heading-links';

import '@diplodoc/cut-extension/runtime/styles.css';
import '@diplodoc/folding-headings-extension/runtime/styles.css';
import '@diplodoc/tabs-extension/runtime/styles.css';
import '@diplodoc/transform/dist/css/yfm.css';

const ML_ATTR = 'data-ml';
// Keep the iframe content created by HTML blocks after the outer sanitizer runs.
const sanitizeOptions = buildYfmHtmlBlockOptions({allowedAttributes: {iframe: ['srcdoc']}});

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

    // Use option fields because callers build the options object on each render.
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
    const [result, setResult] = useState<{html: string; meta?: TransformMeta}>({html: ''});

    useDebounce(
        () => {
            setResult(
                transform(getValue(), {
                    allowHTML,
                    breaks,
                    linkify,
                    linkifyTlds,
                    needToSanitizeHtml,
                    sanitizeOptions,
                    linkAttrs: [[ML_ATTR, true]],
                    defaultClassName: colorClassName,
                    plugins: [
                        ...mdPlugins,
                        ...(disableMarkdownItAttrs
                            ? [(md: MarkdownIt) => md.core.ruler.disable('curly_attributes')]
                            : []),
                    ],
                }).result,
            );
        },
        200,
        [props],
    );

    const yfmHtmlBlockConfig = useYfmHtmlBlockStyles();

    return (
        <GalleryProvider>
            <MarkdownViewer
                qa="demo-md-preview"
                html={result.html}
                className={cnYFM({'no-list-reset': true}, ['demo-preview', sp({pl: 6})])}
            >
                <HeadingAnchors getHref={getHeadingHref} onClick={navigateToHeading} />
                <YfmCodeBlockActions />
                <FilesGallery getCopyUrl={getGalleryUrl} getDownloadUrl={getGalleryUrl} />
                <DiplodocLatex meta={result.meta} runtime={LATEX_RUNTIME} />
                <DiplodocPageConstructor meta={result.meta} runtime={PAGE_CONSTRUCTOR_RUNTIME} />
                <DiplodocMermaid meta={result.meta} runtime={MERMAID_RUNTIME} />
                <DiplodocHtml
                    meta={result.meta}
                    runtime={YFM_HTML_BLOCK_RUNTIME}
                    config={yfmHtmlBlockConfig}
                    runtimeConfig={htmlRuntimeConfig}
                />
            </MarkdownViewer>
        </GalleryProvider>
    );
};

function getGalleryUrl({url}: FilesGallerySource) {
    return url;
}

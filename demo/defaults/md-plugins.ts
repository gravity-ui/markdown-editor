import {transform as yfmCut} from '@diplodoc/cut-extension';
import {transform as yfmFile} from '@diplodoc/file-extension';
import {transform as foldingHeadings} from '@diplodoc/folding-headings-extension';
import '@diplodoc/folding-headings-extension/runtime';
import {transform as yfmHtmlBlock} from '@diplodoc/html-extension';
import {transform as latex} from '@diplodoc/latex-extension';
import {transform as mermaid} from '@diplodoc/mermaid-extension';
import {transform as yfmTabs} from '@diplodoc/tabs-extension';
import anchors from '@diplodoc/transform/lib/plugins/anchors';
import checkbox from '@diplodoc/transform/lib/plugins/checkbox';
import code from '@diplodoc/transform/lib/plugins/code';
import deflist from '@diplodoc/transform/lib/plugins/deflist';
import imsize from '@diplodoc/transform/lib/plugins/imsize';
import meta from '@diplodoc/transform/lib/plugins/meta';
import monospace from '@diplodoc/transform/lib/plugins/monospace';
import notes from '@diplodoc/transform/lib/plugins/notes';
import sup from '@diplodoc/transform/lib/plugins/sup';
import yfmTable from '@diplodoc/transform/lib/plugins/table';
import type {YfmTablePluginOptions} from '@diplodoc/transform/lib/plugins/table/types';
import video from '@diplodoc/transform/lib/plugins/video';
import type {PluginWithParams} from 'markdown-it/lib';

import {emojiDefs} from 'src/bundle/emoji';
import {type RenderPreviewParams, colorClassName} from 'src/index';
import color from 'src/markdown-it/color';
import {bare as emoji} from 'src/markdown-it/emoji';
import ins from 'src/markdown-it/ins';
import mark from 'src/markdown-it/mark';
import sub from 'src/markdown-it/sub';

export const LATEX_RUNTIME = 'extension:latex';
export const MERMAID_RUNTIME = 'extension:mermaid';
export const YFM_HTML_BLOCK_RUNTIME = 'extension:yfm-html-block';

type GetPluginsOptions = {
    directiveSyntax?: RenderPreviewParams['directiveSyntax'];
} & Pick<
    YfmTablePluginOptions,
    'table_ignoreSplittersInBlockMath' | 'table_ignoreSplittersInInlineMath'
>;

export function getPlugins({
    directiveSyntax,
    ...options
}: GetPluginsOptions = {}): markdownit.PluginWithParams[] {
    const defaultPlugins: PluginWithParams[] = [
        anchors,
        code,
        yfmCut({
            bundle: false,
            directiveSyntax: directiveSyntax?.mdPluginValueFor('yfmCut'),
        }),
        deflist,
        yfmFile({
            bundle: false,
            directiveSyntax: directiveSyntax?.mdPluginValueFor('yfmFile'),
        }),
        (md) => md.use(imsize, {enableInlineStyling: true}),
        meta,
        monospace,
        notes,
        sup,
        yfmTabs({
            bundle: false,
            features: {
                enabledVariants: {
                    regular: true,
                    radio: true,
                    dropdown: false,
                    accordion: false,
                },
            },
        }),
        video,
        (md, opts) =>
            yfmTable(md, {
                ...opts,
                table_ignoreSplittersInBlockCode: true,
                table_ignoreSplittersInInlineCode: true,
                table_ignoreSplittersInBlockMath: options.table_ignoreSplittersInBlockMath,
                table_ignoreSplittersInInlineMath: options.table_ignoreSplittersInInlineMath,
            }),
    ];
    const extendedPlugins = defaultPlugins.concat(
        (md) => md.use(emoji, {defs: emojiDefs}),
        checkbox,
        (md) => md.use(color, {escape: true, defaultClassName: colorClassName}),
        ins,
        latex({bundle: false, validate: false, runtime: LATEX_RUNTIME}),
        mark,
        mermaid({bundle: false, runtime: MERMAID_RUNTIME}),
        sub,
        yfmHtmlBlock({
            bundle: false,
            runtimeJsPath: YFM_HTML_BLOCK_RUNTIME,
            head: `
                        <base target="_blank" />
                        <style>
                            html, body {
                                margin: 0;
                                padding: 0;
                            }
                        </style
                    `,
        }),
        foldingHeadings({bundle: false}),
    );

    return extendedPlugins;
}

export const plugins = getPlugins();

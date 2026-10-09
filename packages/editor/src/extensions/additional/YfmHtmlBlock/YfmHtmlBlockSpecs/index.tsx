import {type PluginOptions, transform} from '@diplodoc/html-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '#core';
import {generateEntityId} from 'src/utils/entity-id';

import {YfmHtmlBlockConsts, defaultYfmHtmlBlockEntityId} from './const';

export {yfmHtmlBlockNodeName, YfmHtmlBlockConsts} from './const';

export interface YfmHtmlBlockSpecsOptions extends Omit<
    PluginOptions,
    'runtimeJsPath' | 'containerClasses' | 'bundle' | 'embeddingMode'
> {
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    nodeView?: ExtensionNodeSpec['view'];
}

const YfmHtmlBlockSpecsExtension: ExtensionAuto<YfmHtmlBlockSpecsOptions> = (
    builder,
    {nodeView, ...options},
) => {
    builder
        .configureMd((md) =>
            md.use(
                transform({
                    bundle: false,
                    embeddingMode: 'srcdoc',
                    ...options,
                }),
                {},
            ),
        )
        .addNodeSpec(YfmHtmlBlockConsts.NodeName, () => ({
            group: 'block',
            attrs: {
                [YfmHtmlBlockConsts.NodeAttrs.class]: {default: 'yfm-html'},
                [YfmHtmlBlockConsts.NodeAttrs.frameborder]: {default: ''},
                [YfmHtmlBlockConsts.NodeAttrs.srcdoc]: {default: ''},
                [YfmHtmlBlockConsts.NodeAttrs.style]: {default: null},
                [YfmHtmlBlockConsts.NodeAttrs.newCreated]: {default: null},
                [YfmHtmlBlockConsts.NodeAttrs.EntityId]: {default: defaultYfmHtmlBlockEntityId},
            },
            toDOM: (node) => ['iframe', node.attrs],
        }))
        .addMarkdownTokenParserSpec('yfm_html_block', () => ({
            name: YfmHtmlBlockConsts.NodeName,
            type: 'node',
            noCloseToken: true,
            getAttrs: ({content}) => ({
                [YfmHtmlBlockConsts.NodeAttrs.srcdoc]: content,
                [YfmHtmlBlockConsts.NodeAttrs.EntityId]: generateEntityId(
                    YfmHtmlBlockConsts.NodeName,
                ),
            }),
        }))
        .addNodeSerializerSpec(YfmHtmlBlockConsts.NodeName, () => (state, node) => {
            // The parser includes the line break before closing ::: in srcdoc.
            // Drop only that structural newline; any remaining trailing newline is content.
            const srcdoc = String(node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc] || '').replace(
                /\n$/,
                '',
            );

            state.write('::: html');
            state.ensureNewLine();

            if (srcdoc) {
                state.text(srcdoc, false);
                // At top level, state.text() has no visible delimiter for a final empty line.
                if (srcdoc.endsWith('\n') && state.atBlank()) {
                    state.write('\n');
                }
                state.ensureNewLine();
            }

            state.write(':::');
            state.closeBlock(node);
        });

    if (nodeView) {
        builder.addNodeView(YfmHtmlBlockConsts.NodeName, nodeView);
    }
};

export const YfmHtmlBlockSpecs = Object.assign(YfmHtmlBlockSpecsExtension, YfmHtmlBlockConsts);

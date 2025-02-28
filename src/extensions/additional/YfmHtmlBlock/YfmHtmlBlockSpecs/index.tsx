import {type PluginOptions, transform} from '@diplodoc/html-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';

import {YfmHtmlBlockConsts} from './const';

export {yfmHtmlBlockNodeName} from './const';

export interface YfmHtmlBlockSpecsOptions
    extends Omit<PluginOptions, 'runtimeJsPath' | 'containerClasses' | 'bundle' | 'embeddingMode'> {
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
        .addNode(YfmHtmlBlockConsts.NodeName, () => ({
            fromMd: {
                tokenSpec: {
                    name: YfmHtmlBlockConsts.NodeName,
                    type: 'node',
                    noCloseToken: true,
                    getAttrs: ({content}) => ({srcdoc: content}),
                },
            },
            spec: {
                group: 'block',
                attrs: {
                    [YfmHtmlBlockConsts.NodeAttrs.class]: {default: 'yfm-html'},
                    [YfmHtmlBlockConsts.NodeAttrs.frameborder]: {default: ''},
                    [YfmHtmlBlockConsts.NodeAttrs.srcdoc]: {default: ''},
                    [YfmHtmlBlockConsts.NodeAttrs.style]: {default: null},
                    [YfmHtmlBlockConsts.NodeAttrs.newCreated]: {default: null},
                },
                toDOM: (node) => ['div', {class: 'yfm-iframe-container'}, ['iframe', node.attrs]],
            },
            toMd: (state, node) => {
                state.write('::: html');
                state.write('\n');
                state.write(node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc]);
                state.ensureNewLine();
                state.write(':::');
                state.closeBlock(node);
            },
            view: nodeView,
        }));
};

export const YfmHtmlBlockSpecs = Object.assign(YfmHtmlBlockSpecsExtension, YfmHtmlBlockConsts);

// eslint-disable-next-line import/no-extraneous-dependencies
import {transform} from '@diplodoc/html-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';

import {YfmHtmlBlockConsts} from './const';

export {yfmHtmlBlockNodeName} from './const';

export type YfmHtmlBlockSpecsOptions = {
    nodeView?: ExtensionNodeSpec['view'];
    sanitize?: (dirtyHtml: string) => string;
};

const YfmHtmlBlockSpecsExtension: ExtensionAuto<YfmHtmlBlockSpecsOptions> = (
    builder,
    {nodeView, sanitize},
) => {
    builder
        .configureMd((md) => md.use(transform({bundle: false, sanitize}), {}))
        .addNode(YfmHtmlBlockConsts.NodeName, () => ({
            fromMd: {
                tokenSpec: {
                    name: YfmHtmlBlockConsts.NodeName,
                    type: 'node',
                    noCloseToken: true,
                    getAttrs: (token) => Object.fromEntries(token.attrs ?? []),
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
                toDOM: (node) => ['iframe', node.attrs],
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

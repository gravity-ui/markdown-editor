// eslint-disable-next-line import/no-extraneous-dependencies
import {transform} from '@diplodoc/html-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';

import {YfmHtmlConsts} from './const';

export {yfmHtmlNodeName} from './const';

export type YfmHtmlSpecsOptions = {
    nodeView?: ExtensionNodeSpec['view'];
};

const YfmHtmlSpecsExtension: ExtensionAuto<YfmHtmlSpecsOptions> = (builder, {nodeView}) => {
    builder
        .configureMd((md) => md.use(transform({bundle: false}), {}))
        .addNode(YfmHtmlConsts.NodeName, () => ({
            fromMd: {
                tokenSpec: {
                    name: YfmHtmlConsts.NodeName,
                    type: 'node',
                    noCloseToken: true,
                    getAttrs: (token) => Object.fromEntries(token.attrs ?? []),
                },
            },
            spec: {
                group: 'block',
                attrs: {
                    [YfmHtmlConsts.NodeAttrs.class]: {default: 'yfm-html'},
                    [YfmHtmlConsts.NodeAttrs.frameborder]: {default: ''},
                    [YfmHtmlConsts.NodeAttrs.srcdoc]: {default: ''},
                    [YfmHtmlConsts.NodeAttrs.style]: {default: null},
                    [YfmHtmlConsts.NodeAttrs.newCreated]: {default: null},
                },
                toDOM: (node) => ['iframe', node.attrs],
            },
            toMd: (state, node) => {
                state.write('::: html');
                state.write('\n');
                state.write(node.attrs[YfmHtmlConsts.NodeAttrs.srcdoc]);
                state.ensureNewLine();
                state.write(':::');
                state.closeBlock(node);
            },
            view: nodeView,
        }));
};

export const YfmHtmlSpecs = Object.assign(YfmHtmlSpecsExtension, YfmHtmlConsts);

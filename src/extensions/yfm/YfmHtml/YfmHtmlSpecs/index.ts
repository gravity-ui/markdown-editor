import {transform} from '@diplodoc/html-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';

import {YfmHtml} from './const';

const YfmHtmlSpecsExtension: ExtensionAuto<Pick<ExtensionNodeSpec, 'view'>> = (builder, {view}) => {
    builder
        .configureMd((md) => md.use(transform({bundle: false}), {}))
        .addNode(YfmHtml.NodeName, () => ({
            fromMd: {
                tokenSpec: {
                    name: YfmHtml.NodeName,
                    type: 'node',
                    noCloseToken: true,
                    getAttrs: (token) => Object.fromEntries(token.attrs ?? []),
                },
            },
            spec: {
                group: 'block',
                attrs: {
                    [YfmHtml.NodeAttrs.class]: {default: 'yfm-html'},
                    [YfmHtml.NodeAttrs.frameborder]: {default: ''},
                    [YfmHtml.NodeAttrs.srcdoc]: {default: ''},
                    [YfmHtml.NodeAttrs.style]: {default: null},
                },
                toDOM: (node) => ['iframe', node.attrs],
            },
            toMd: (state, node) => {
                state.write('::: html');
                state.write('\n');
                state.write(node.attrs[YfmHtml.NodeAttrs.srcdoc]);
                state.ensureNewLine();
                state.write(':::');
                state.closeBlock(node);
            },
            view,
        }));
};

export const YfmHtmlSpecs = Object.assign(YfmHtmlSpecsExtension, YfmHtml);

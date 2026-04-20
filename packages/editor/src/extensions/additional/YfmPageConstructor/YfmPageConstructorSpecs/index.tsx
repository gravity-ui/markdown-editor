import {transform} from '@diplodoc/page-constructor-extension/plugin/csr';

import type {ExtensionAuto, ExtensionNodeSpec} from '#core';
import {generateEntityId} from 'src/utils/entity-id';

import {
    YfmPageConstructorConsts,
    defaultYfmPageConstructorEntityId,
    yfmPageConstructorNodeName,
    yfmPageConstructorTokenName,
} from './const';

export {yfmPageConstructorNodeName, YfmPageConstructorConsts} from './const';

export type YfmPageConstructorSpecsOptions = {
    nodeView?: ExtensionNodeSpec['view'];
};

const YfmPageConstructorSpecsExtension: ExtensionAuto<YfmPageConstructorSpecsOptions> = (
    builder,
    {nodeView},
) => {
    builder
        .configureMd((md) => md.use(transform({bundle: false}), {}))
        .addNode(yfmPageConstructorNodeName, () => ({
            fromMd: {
                tokenName: yfmPageConstructorTokenName,
                tokenSpec: {
                    name: yfmPageConstructorNodeName,
                    type: 'node',
                    noCloseToken: true,
                    getAttrs: ({content}) => ({
                        [YfmPageConstructorConsts.NodeAttrs.content]: content,
                        [YfmPageConstructorConsts.NodeAttrs.EntityId]: generateEntityId(
                            yfmPageConstructorNodeName,
                        ),
                    }),
                },
            },
            spec: {
                selectable: true,
                atom: true,
                group: 'block',
                attrs: {
                    [YfmPageConstructorConsts.NodeAttrs.content]: {default: ''},
                    [YfmPageConstructorConsts.NodeAttrs.EntityId]: {
                        default: defaultYfmPageConstructorEntityId,
                    },
                },
                parseDOM: [],
                toDOM(node) {
                    return ['div', node.attrs];
                },
                dnd: {props: {offset: [8, 1]}},
            },
            toMd: (state, node) => {
                const content = String(
                    node.attrs[YfmPageConstructorConsts.NodeAttrs.content] || '',
                );

                state.write('::: page-constructor');
                state.ensureNewLine();

                if (content) {
                    state.text(content.trimEnd(), false);
                    state.ensureNewLine();
                }

                state.write(':::');
                state.closeBlock(node);
            },
            view: nodeView,
        }));
};

export const YfmPageConstructorSpecs = Object.assign(
    YfmPageConstructorSpecsExtension,
    YfmPageConstructorConsts,
);

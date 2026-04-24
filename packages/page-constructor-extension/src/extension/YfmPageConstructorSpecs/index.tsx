import {transform} from '@diplodoc/page-constructor-extension/plugin/csr';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor';
import {generateEntityId} from '@gravity-ui/markdown-editor';

import {
    YfmPageConstructorConsts,
    defaultYfmPageConstructorEntityId,
    yfmPageConstructorNodeName,
    yfmPageConstructorTokenName,
} from './const';

export {yfmPageConstructorNodeName, YfmPageConstructorConsts} from './const';

export const YfmPageConstructorSpecsExtension: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(transform({bundle: false}), {}))
        .addNodeSpec(yfmPageConstructorNodeName, () => ({
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
        }))
        .addMarkdownTokenParserSpec(yfmPageConstructorTokenName, () => ({
            name: yfmPageConstructorNodeName,
            type: 'node',
            noCloseToken: true,
            getAttrs: ({content}) => ({
                [YfmPageConstructorConsts.NodeAttrs.content]: content,
                [YfmPageConstructorConsts.NodeAttrs.EntityId]: generateEntityId(
                    yfmPageConstructorNodeName,
                ),
            }),
        }))
        .addNodeSerializerSpec(yfmPageConstructorNodeName, () => (state, node) => {
            const content = String(node.attrs[YfmPageConstructorConsts.NodeAttrs.content] || '');

            state.write('::: page-constructor');
            state.ensureNewLine();

            if (content) {
                state.text(content.trimEnd(), false);
                state.ensureNewLine();
            }

            state.write(':::');
            state.closeBlock(node);
        });
};

export const YfmPageConstructorSpecs = Object.assign(
    YfmPageConstructorSpecsExtension,
    YfmPageConstructorConsts,
);

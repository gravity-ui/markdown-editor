import type {Node} from 'prosemirror-model';
import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export const blockquoteNodeName = 'blockquote';
export const blockquoteType = nodeTypeFactory(blockquoteNodeName);
export const isBlockqouteNode = (node: Node) => node.type.name === blockquoteNodeName;

export const BlockquoteSpecs: ExtensionAuto = (builder) => {
    builder.addNode(blockquoteNodeName, () => ({
        spec: {
            content: 'block+',
            group: 'block',
            defining: true,
            parseDOM: [{tag: 'blockquote'}],
            toDOM() {
                return ['blockquote', 0];
            },
        },
        fromYfm: {tokenSpec: {name: blockquoteNodeName, type: 'block'}},
        toYfm: (state, node) => {
            state.wrapBlock('> ', null, node, () => state.renderContent(node));
        },
    }));
};

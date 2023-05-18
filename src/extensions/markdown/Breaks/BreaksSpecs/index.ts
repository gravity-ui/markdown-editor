import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export enum BreakNodeName {
    HardBreak = 'hard_break',
    SoftBreak = 'soft_break',
}

export const hbType = nodeTypeFactory(BreakNodeName.HardBreak);
export const sbType = nodeTypeFactory(BreakNodeName.SoftBreak);

export const BreaksSpecs: ExtensionAuto = (builder) => {
    builder.addNode(BreakNodeName.HardBreak, () => ({
        spec: {
            inline: true,
            group: 'inline break',
            marks: '',
            isBreak: true,
            selectable: false,
            parseDOM: [{tag: 'br'}],
            toDOM() {
                return ['br'];
            },
        },
        fromYfm: {tokenName: 'hardbreak', tokenSpec: {name: BreakNodeName.HardBreak, type: 'node'}},
        toYfm: (state, node, parent, index) => {
            for (let i = index + 1; i < parent.childCount; i++) {
                if (parent.child(i).type !== node.type) {
                    state.write('\\\n');
                    return;
                }
            }
        },
    }));

    // TODO: should we handle softbreak differently at different md.options.breaks setting?

    // we can safely convert softbreak into hardbreak,
    // but in this case non-edited markup will always be changed – a backspash will be added
    builder.addNode(BreakNodeName.SoftBreak, () => ({
        spec: {
            inline: true,
            group: 'inline break',
            marks: '',
            isBreak: true,
            selectable: false,
            toDOM() {
                return ['br'];
            },
        },
        fromYfm: {tokenName: 'softbreak', tokenSpec: {name: BreakNodeName.SoftBreak, type: 'node'}},
        toYfm: (state, node, parent, index) => {
            for (let i = index + 1; i < parent.childCount; i++) {
                if (parent.child(i).type !== node.type) {
                    state.write('\n');
                    return;
                }
            }
        },
    }));
};

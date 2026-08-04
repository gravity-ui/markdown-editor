import type {TagParseRule} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

export enum BreakNodeName {
    HardBreak = 'hard_break',
    SoftBreak = 'soft_break',
}

export const hbType = nodeTypeFactory(BreakNodeName.HardBreak);
export const sbType = nodeTypeFactory(BreakNodeName.SoftBreak);

export type BreaksSpecsOptions = {
    /**
     * @default 'hard'
     */
    preferredBreak?: 'hard' | 'soft';
};

export const BreaksSpecs: ExtensionAuto<BreaksSpecsOptions> = (builder, opts) => {
    const {preferredBreak = 'hard'} = opts;

    const parseDOM: TagParseRule[] = [{tag: 'br'}];

    builder
        .addNodeSpec(BreakNodeName.HardBreak, () => ({
            inline: true,
            group: 'inline break',
            marks: '',
            isBreak: true,
            selectable: false,
            parseDOM: preferredBreak === 'hard' ? parseDOM : undefined,
            toDOM() {
                return ['br'];
            },
        }))
        .addMarkdownTokenParserSpec('hardbreak', () => ({
            name: BreakNodeName.HardBreak,
            type: 'node',
        }))
        .addNodeSerializerSpec(BreakNodeName.HardBreak, () => (state, node, parent, index) => {
            for (let i = index + 1; i < parent.childCount; i++) {
                if (parent.child(i).type !== node.type) {
                    state.write('\\\n');
                    return;
                }
            }
        });

    // TODO: should we handle softbreak differently at different md.options.breaks setting?

    // we can safely convert softbreak into hardbreak,
    // but in this case non-edited markup will always be changed – a backspash will be added
    builder
        .addNodeSpec(BreakNodeName.SoftBreak, () => ({
            inline: true,
            group: 'inline break',
            marks: '',
            isBreak: true,
            selectable: false,
            parseDOM: preferredBreak === 'soft' ? parseDOM : undefined,
            toDOM() {
                return ['br'];
            },
        }))
        .addMarkdownTokenParserSpec('softbreak', () => ({
            name: BreakNodeName.SoftBreak,
            type: 'node',
        }))
        .addNodeSerializerSpec(BreakNodeName.SoftBreak, () => (state, node, parent, index) => {
            for (let i = index + 1; i < parent.childCount; i++) {
                if (parent.child(i).type !== node.type) {
                    state.write('\n');
                    return;
                }
            }
        });
};

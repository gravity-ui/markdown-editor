import {type EditorState, Plugin, PluginKey, type Transaction} from '#pm/state';
import {Decoration, DecorationSet} from '#pm/view';

import {codeBlockType} from '../../CodeBlockSpecs';

type StateShape = {
    decorations: DecorationSet;
};

const pluginKey = new PluginKey<StateShape>('code_block_line_wrapping');

type Meta = {
    type: 'add' | 'remove';
    pos: number;
};

const WRAPPING_SPEC_KEY = '__code_block_line_wrapping';
const WRAPPING_SPEC_VALUE = true;

const isLineWrappingDecoration = (deco: Decoration) =>
    deco.spec?.[WRAPPING_SPEC_KEY] === WRAPPING_SPEC_VALUE;

/** @internal */
export const hasLineWrappingDecoration = (decorations: readonly Decoration[]): boolean => {
    return decorations.some(isLineWrappingDecoration);
};

/** @internal */
export const isNodeHasLineWrapping = (state: EditorState, pos: number): boolean => {
    const node = state.doc.nodeAt(pos);
    if (!node || node.type !== codeBlockType(state.doc.type.schema)) return false;
    const decos = pluginKey.getState(state)?.decorations.find(pos + 1, pos + node.nodeSize - 1);
    return decos?.some(isLineWrappingDecoration) ?? false;
};

/** @internal */
export function enableLineWrapping(tr: Transaction, pos: number): Transaction {
    return tr.setMeta(pluginKey, {type: 'add', pos} satisfies Meta);
}

/** @internal */
export function disableLineWrapping(tr: Transaction, pos: number): Transaction {
    return tr.setMeta(pluginKey, {type: 'remove', pos} satisfies Meta);
}

/** @internal */
export const codeBlockLineWrappingPlugin = () => {
    return new Plugin<StateShape>({
        key: pluginKey,
        state: {
            init() {
                return {
                    decorations: DecorationSet.empty,
                };
            },
            apply(tr, value) {
                let decorations = value.decorations.map(tr.mapping, tr.doc);

                if (tr.getMeta(pluginKey)) {
                    const meta = tr.getMeta(pluginKey) as Meta;

                    if (meta.type === 'add') {
                        const node = tr.doc.nodeAt(meta.pos);
                        if (node?.type === codeBlockType(tr.doc.type.schema)) {
                            const from = meta.pos;
                            const to = meta.pos + node.nodeSize;
                            decorations = decorations.add(tr.doc, [
                                Decoration.node(
                                    from,
                                    to,
                                    {},
                                    {[WRAPPING_SPEC_KEY]: WRAPPING_SPEC_VALUE},
                                ),
                            ]);
                        }
                    } else if (meta.type === 'remove') {
                        const node = tr.doc.nodeAt(meta.pos);
                        if (node?.type === codeBlockType(tr.doc.type.schema)) {
                            const start = meta.pos + 1;
                            const end = meta.pos + node.nodeSize - 1;
                            const found = decorations.find(start, end);
                            decorations = decorations.remove(found);
                        }
                    }
                }

                return {decorations};
            },
        },
        props: {
            decorations(state) {
                return pluginKey.getState(state)?.decorations;
            },
        },
    });
};

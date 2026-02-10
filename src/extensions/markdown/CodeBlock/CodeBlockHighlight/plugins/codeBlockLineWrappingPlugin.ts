import {type EditorState, Plugin, PluginKey, type Transaction} from '#pm/state';
import {Decoration, DecorationSet} from '#pm/view';

import {codeBlockType} from '../../CodeBlockSpecs';

// TODO: remove
const counter = (() => {
    let i = 0;
    return () => i++;
})();

type StateShape = {
    decorations: DecorationSet;
};

const pluginKey = new PluginKey<StateShape>('code_block_line_wrapping');

type Meta = {
    type: 'add' | 'remove';
    pos: number;
};

const isLineWrappingDecoration = (deco: Decoration) => deco.spec?.lineWrapping === true;

export const hasLineWrappingDecoration = (decorations: readonly Decoration[]): boolean => {
    return decorations.some(isLineWrappingDecoration);
};

export const isNodeHasLineWrapping = (state: EditorState, pos: number): boolean => {
    const node = state.doc.nodeAt(pos);
    if (!node || node.type !== codeBlockType(state.doc.type.schema)) return false;
    const decos = pluginKey.getState(state)?.decorations.find(pos + 1, pos + node.nodeSize - 1);
    return decos?.some(isLineWrappingDecoration) ?? false;
};

export function enableLineWrapping(tr: Transaction, pos: number): Transaction {
    return tr.setMeta(pluginKey, {type: 'add', pos} satisfies Meta);
}

export function disableLineWrapping(tr: Transaction, pos: number): Transaction {
    return tr.setMeta(pluginKey, {type: 'remove', pos} satisfies Meta);
}

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
                let decos = value.decorations.map(tr.mapping, tr.doc);

                if (tr.getMeta(pluginKey)) {
                    const meta = tr.getMeta(pluginKey) as Meta;

                    if (meta.type === 'add') {
                        const node = tr.doc.nodeAt(meta.pos);
                        if (node?.type === codeBlockType(tr.doc.type.schema)) {
                            const from = meta.pos;
                            const to = meta.pos + node.nodeSize;
                            const id = counter();
                            decos = decos.add(tr.doc, [
                                Decoration.node(
                                    from,
                                    to,
                                    {'data-line-wrapping': String(id)},
                                    {lineWrapping: true, id},
                                ),
                            ]);
                        }
                    } else if (meta.type === 'remove') {
                        const node = tr.doc.nodeAt(meta.pos);
                        if (node?.type === codeBlockType(tr.doc.type.schema)) {
                            const start = meta.pos + 1;
                            const end = meta.pos + node.nodeSize - 1;
                            const found = decos.find(start, end);
                            decos = decos.remove(found);
                        }
                    }
                }

                return {decorations: decos};
            },
        },
        props: {
            decorations(state) {
                return pluginKey.getState(state)?.decorations;
            },
        },
    });
};

import type {Node} from '#pm/model';
import {Plugin, PluginKey} from '#pm/state';
import {findChildrenByType} from '#pm/utils';
import {Decoration, DecorationSet} from '#pm/view';

import {codeBlockType} from '../../CodeBlockSpecs';
import {isLineNumbersVisible, processChangedCodeBlocks} from '../utils';

type LineNumberCache = WeakSet<Node>;

type PluginState = {
    cache: LineNumberCache;
    decoSet: DecorationSet;
};

const pluginKey = new PluginKey<PluginState>('code_block_line_numbers_decorations');

/** @internal */
export const codeBlockLineNumbersPlugin = () => {
    return new Plugin<PluginState>({
        key: pluginKey,
        state: {
            init(_config, state) {
                const cache: LineNumberCache = new WeakSet();
                return {cache, decoSet: buildAllDecorations(state.doc, cache)};
            },
            apply(tr, {cache, decoSet}) {
                if (!tr.docChanged) return {cache, decoSet};

                decoSet = processChangedCodeBlocks(tr, decoSet, (node, pos, decoSet) => {
                    if (!isLineNumbersVisible(node)) {
                        return decoSet.remove(decoSet.find(pos, pos + node.nodeSize));
                    }

                    if (cache.has(node)) {
                        // node has not changed, but decorations may be missing (after undo/redo)
                        if (!decoSet.find(pos, pos + node.nodeSize).length) {
                            return decoSet.add(tr.doc, buildNodeDecorations(node, pos));
                        }
                        return decoSet;
                    }

                    decoSet = decoSet.remove(decoSet.find(pos, pos + node.nodeSize));
                    cache.add(node);
                    return decoSet.add(tr.doc, buildNodeDecorations(node, pos));
                });

                return {cache, decoSet};
            },
        },
        props: {
            decorations(state) {
                return pluginKey.getState(state)?.decoSet;
            },
        },
    });
};

function buildAllDecorations(doc: Node, cache: LineNumberCache) {
    const decos: Decoration[] = [];

    for (const {node, pos} of findChildrenByType(doc, codeBlockType(doc.type.schema), true)) {
        if (!isLineNumbersVisible(node)) continue;

        const nodeDecos = buildNodeDecorations(node, pos);
        cache.add(node);
        decos.push(...nodeDecos);
    }

    return DecorationSet.create(doc, decos);
}

function buildNodeDecorations(node: Node, pos: number): Decoration[] {
    const decos: Decoration[] = [];
    const codeContent = node.textContent;
    const contentByLines = codeContent.split('\n');
    const maxDigits = String(contentByLines.length).length;

    let shift = 0;
    for (let i = 0; i < contentByLines.length; i++) {
        const line = contentByLines[i];

        const elem = document.createElement('span');
        elem.classList.add('yfm-line-number');
        elem.textContent = String(i + 1).padStart(maxDigits, ' ');

        decos.push(Decoration.widget(pos + shift + 1, elem, {side: 1, ignoreSelection: true}));

        shift += line.length + 1;
    }

    return decos;
}

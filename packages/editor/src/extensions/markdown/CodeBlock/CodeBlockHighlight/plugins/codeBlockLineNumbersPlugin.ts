import type {Node} from '#pm/model';
import {Plugin, PluginKey} from '#pm/state';
import {findChildrenByType} from '#pm/utils';
import {Decoration, DecorationSet} from '#pm/view';

import {codeBlockType} from '../../CodeBlockSpecs';
import {isLineNumbersVisible} from '../utils';

const pluginKey = new PluginKey<DecorationSet>('code_block_line_numbers_decorations');

/** @internal */
export const codeBlockLineNumbersPlugin = () => {
    return new Plugin<DecorationSet>({
        key: pluginKey,
        state: {
            init(_config, state) {
                return getDecorations(state.doc);
            },
            apply(tr, decos) {
                if (tr.docChanged) {
                    return getDecorations(tr.doc);
                }

                return decos.map(tr.mapping, tr.doc);
            },
        },
        props: {
            decorations(state) {
                return pluginKey.getState(state);
            },
        },
    });
};

function getDecorations(doc: Node) {
    const decos: Decoration[] = [];

    for (const {node, pos} of findChildrenByType(doc, codeBlockType(doc.type.schema), true)) {
        if (!isLineNumbersVisible(node)) continue;

        const codeContent = node.textContent;
        const contentByLines = codeContent.split('\n');

        const maxDigits = String(contentByLines.length).length;

        let shift = 0;
        for (let i = 0; i < contentByLines.length; i++) {
            const line = contentByLines[i];

            {
                const elem = document.createElement('span');
                elem.classList.add('yfm-line-number');
                elem.textContent = String(i + 1).padStart(maxDigits, ' ');

                decos.push(
                    Decoration.widget(pos + shift + 1, elem, {side: 1, ignoreSelection: true}),
                );
            }

            shift += line.length + 1;
        }
    }

    return DecorationSet.create(doc, decos);
}

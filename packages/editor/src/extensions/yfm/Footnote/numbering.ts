import type {Node} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

import {footnoteNodeName} from './FootnoteSpecs';

export function footnoteDecorations(doc: Node) {
    let number = 0;
    const decorations: Decoration[] = [];
    doc.descendants((node, pos) => {
        if (node.type.name !== footnoteNodeName) return;
        const marker = node.attrs.marker ?? String(++number);
        decorations.push(
            Decoration.node(
                pos,
                pos + node.nodeSize,
                {'data-footnote-number': marker},
                {footnoteMarker: marker},
            ),
        );
    });
    return DecorationSet.create(doc, decorations);
}

const key = new PluginKey<DecorationSet>('footnote-numbering');

export const footnoteNumbering = () =>
    new Plugin<DecorationSet>({
        key,
        state: {
            init: (_, state) => footnoteDecorations(state.doc),
            apply: (tr, decorations) => (tr.docChanged ? footnoteDecorations(tr.doc) : decorations),
        },
        props: {decorations: (state) => key.getState(state)},
    });

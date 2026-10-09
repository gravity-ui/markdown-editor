import type {Node} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

import {footnoteDefinitionNodeName, footnoteNodeName} from './FootnoteSpecs';

export function footnoteDefinitions(doc: Node) {
    const definitions = new Map<string, {node: Node; pos: number}>();
    doc.descendants((node, pos) => {
        if (node.type.name === footnoteDefinitionNodeName && !definitions.has(node.attrs.key)) {
            definitions.set(node.attrs.key, {node, pos});
        }
    });
    return definitions;
}

export function footnoteDecorations(doc: Node) {
    const definitions = footnoteDefinitions(doc);
    const decorations: Decoration[] = [];
    doc.descendants((node, pos) => {
        if (node.type.name !== footnoteNodeName) return;
        const content = definitions.get(node.attrs.key)?.node.attrs.content ?? '';
        decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, {footnoteContent: content}));
    });
    return DecorationSet.create(doc, decorations);
}

const key = new PluginKey<DecorationSet>('footnote-definitions');

export const footnoteDefinitionPlugin = () =>
    new Plugin<DecorationSet>({
        key,
        state: {
            init: (_, state) => footnoteDecorations(state.doc),
            apply: (tr, decorations) => (tr.docChanged ? footnoteDecorations(tr.doc) : decorations),
        },
        props: {decorations: (state) => key.getState(state)},
    });

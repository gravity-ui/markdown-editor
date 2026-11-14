import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {Decoration, DecorationSet} from '@gravity-ui/markdown-editor/pm/view';

import {buttonNodeType} from '../../ButtonSpecs';

import './ButtonRow.scss';

const b = cn('button-row');

const isSpace = (node: Node) => node.isText && !node.marks.length && !node.text?.trim();

/** A row is a paragraph of buttons and spaces, as the Markdown plugin marks it. */
function rowDecorations(doc: Node): DecorationSet {
    const {schema} = doc.type;
    const button = buttonNodeType(schema);
    const isButton = (node: Node) => node.type === button && !node.marks.length;
    const decorations: Decoration[] = [];
    doc.descendants((paragraph, pos) => {
        if (!paragraph.isTextblock) return true;
        const {children} = paragraph;
        if (
            paragraph.type === schema.nodes.paragraph &&
            children.some(isButton) &&
            children.every((child) => isButton(child) || isSpace(child))
        ) {
            decorations.push(Decoration.node(pos, pos + paragraph.nodeSize, {class: b()}));
            paragraph.forEach((child, offset) => {
                if (!child.isText) return;
                const from = pos + 1 + offset;
                decorations.push(
                    Decoration.inline(from, from + child.nodeSize, {class: b('space')}),
                );
            });
        }
        return false;
    });
    return DecorationSet.create(doc, decorations);
}

export const buttonRowPlugin = () =>
    new Plugin<DecorationSet>({
        state: {
            init: (_config, {doc}) => rowDecorations(doc),
            apply: (tr, rows) => (tr.docChanged ? rowDecorations(tr.doc) : rows),
        },
        props: {
            decorations(state) {
                return this.getState(state);
            },
        },
    });

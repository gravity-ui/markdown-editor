import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {Decoration, DecorationSet} from '@gravity-ui/markdown-editor/pm/view';
import {buttonRowClassName} from '@gravity-ui/markdown-plugin-banner';

import {changedRange, coveringMapping} from '../../../changedRange';
import {isButton, isButtonRow} from '../../ButtonSpecs/utils';

import './plugin.scss';

export const buttonRowSpaceClassName = cn('button-plugin-row')('space');

const REBUILD_SHARE = 0.5;

function isPlainRow(node: Node) {
    let plain = isButtonRow(node);
    node.forEach((child) => {
        plain &&= child.marks.length === 0;
    });
    return plain;
}

function rowDecorations(doc: Node, from: number, to: number) {
    const decorations: Decoration[] = [];
    let start = from;
    let end = to;
    doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isTextblock) return true;
        start = Math.min(start, pos);
        end = Math.max(end, pos + node.nodeSize);
        if (isPlainRow(node)) {
            decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {class: buttonRowClassName}),
            );
            node.forEach((child, offset) => {
                if (isButton(child)) return;
                const text = pos + 1 + offset;
                decorations.push(
                    Decoration.inline(text, text + child.nodeSize, {
                        class: buttonRowSpaceClassName,
                    }),
                );
            });
        }
        return false;
    });
    return {start, end, decorations};
}

const allRows = (doc: Node) =>
    DecorationSet.create(doc, rowDecorations(doc, 0, doc.content.size).decorations);

export const buttonRowPlugin = () =>
    new Plugin<DecorationSet>({
        state: {
            init: (_config, {doc}) => allRows(doc),
            apply: (tr, rows) => {
                if (!tr.docChanged) return rows;
                const range = changedRange(tr, 'after');
                if (!range) return rows.map(tr.mapping, tr.doc);
                if (range.to - range.from >= REBUILD_SHARE * tr.doc.content.size)
                    return allRows(tr.doc);
                const mapped = rows.map(coveringMapping(tr, range), tr.doc);
                const {start, end, decorations} = rowDecorations(
                    tr.doc,
                    Math.max(0, range.from - 1),
                    Math.min(tr.doc.content.size, range.to + 1),
                );
                const stale = mapped
                    .find(start, end, () => true)
                    .filter((decoration) => decoration.from >= start && decoration.to <= end);
                return mapped.remove(stale).add(tr.doc, decorations);
            },
        },
        props: {
            decorations(state) {
                return this.getState(state);
            },
        },
    });

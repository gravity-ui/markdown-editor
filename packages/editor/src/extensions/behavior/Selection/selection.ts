import {selectParentNode} from 'prosemirror-commands';
import {keydownHandler} from 'prosemirror-keymap';
import type {Node} from 'prosemirror-model';
import {
    AllSelection,
    type Command,
    NodeSelection,
    Plugin,
    type Selection,
    TextSelection,
    type Transaction,
} from 'prosemirror-state';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

import {isSelectableNode} from '../../../utils/nodes';
import {isNodeSelection} from '../../../utils/selection';

import {arrowDown, arrowLeft, arrowRight, arrowUp, backspace, selectAll} from './commands';

import './selection.scss';

export const selection = () =>
    new Plugin({
        props: {
            handleKeyDown: keydownHandler({
                ArrowLeft: arrowLeft,
                ArrowRight: arrowRight,
                ArrowUp: arrowUp,
                ArrowDown: arrowDown,
                Backspace: backspace,
                'Mod-a': selectAll,
            }),
            decorations(state) {
                return getDecorations(state.tr);
            },
            handleClickOn(view, _pos, node, nodePos, _event, direct) {
                if (direct && node.type.spec.allowSelection) {
                    return selectNode(nodePos)(view.state, view.dispatch);
                }

                return false;
            },
        },
        view(view) {
            reselect(view);
            return {
                update(view) {
                    reselect(view);
                },
            };
        },
    });

declare module 'prosemirror-model' {
    interface NodeSpec {
        /**
         * Whether clicking directly on this node creates a NodeSelection for it.
         * Typically `true` for root complex nodes (tables, cuts, notes)
         * and `false` for their inner parts and leaf elements.
         */
        allowSelection?: boolean | undefined;
        /**
         * Controls how this node participates in hierarchical select-all (Cmd+A / Ctrl+A).
         * Each press of select-all walks up the node tree and selects the nearest matching ancestor.
         *
         * - `'content'` — select the node's content (TextSelection over inner content range)
         * - `'node'` — select the node itself (NodeSelection)
         * - `false` — skip this node during select-all traversal
         * - `undefined` — default: textblocks and code nodes select their content, others are skipped
         */
        selectAll?: false | 'node' | 'content' | undefined;
    }
}

const reselect = (view: EditorView) => {
    const {selection: sel} = view.state;
    if (!sel.empty && isNodeSelection(sel) && !isSelectableNode(sel.node)) {
        return selectParentNode(view.state, view.dispatch);
    }
    return false;
};

const selectNode =
    (pos: number): Command =>
    (state, dispatch) => {
        if (dispatch) {
            dispatch(state.tr.setSelection(new NodeSelection(state.doc.resolve(pos))));
        }
        return true;
    };

const getDecorations = (tr: Transaction): DecorationSet => {
    if (tr.selection instanceof NodeSelection) {
        return DecorationSet.create(tr.doc, [
            Decoration.node(tr.selection.from, tr.selection.to, {
                class: 'pm-node-selected',
            }),
        ]);
    }

    if (tr.selection instanceof TextSelection || tr.selection instanceof AllSelection) {
        const decorations = getTopLevelNodesFromSelection(tr.selection, tr.doc).map(
            ({node, pos}) => {
                return Decoration.node(pos, pos + node.nodeSize, {
                    class: 'pm-node-selected',
                });
            },
        );
        return DecorationSet.create(tr.doc, decorations);
    }
    return DecorationSet.empty;
};

const getTopLevelNodesFromSelection = (selection: Selection, doc: Node) => {
    const nodes: {node: Node; pos: number}[] = [];
    if (selection.from !== selection.to) {
        const {from, to} = selection;

        doc.nodesBetween(from, to, (node, pos) => {
            const withinSelection = from <= pos && pos + node.nodeSize <= to;

            if (node && !node.isText && node.type.spec.selectable !== false && withinSelection) {
                nodes.push({node, pos});

                return false;
            }

            return true;
        });
    }
    return nodes;
};

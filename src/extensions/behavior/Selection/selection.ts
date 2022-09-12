import type {Node} from 'prosemirror-model';
import {keydownHandler} from 'prosemirror-keymap';
import {selectParentNode} from 'prosemirror-commands';
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view';
import {
    AllSelection,
    Command,
    NodeSelection,
    Plugin,
    Selection,
    TextSelection,
    Transaction,
} from 'prosemirror-state';

import {isSelectableNode} from '../../../utils/nodes';
import {isNodeSelection} from '../../../utils/selection';
import {arrowDown, arrowLeft, arrowRight, arrowUp} from './commands';

import './selection.scss';

export const selection = () =>
    new Plugin({
        props: {
            handleKeyDown: keydownHandler({
                ArrowLeft: arrowLeft,
                ArrowRight: arrowRight,
                ArrowUp: arrowUp,
                ArrowDown: arrowDown,
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
        allowSelection?: boolean | undefined;
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
            if (
                node &&
                node.type.name !== 'paragraph' &&
                !node.isText &&
                node.type.spec.selectable &&
                withinSelection
            ) {
                nodes.push({node, pos});
                return false;
            }
            return true;
        });
    }
    return nodes;
};

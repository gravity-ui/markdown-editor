import {Plugin, PluginKey} from 'prosemirror-state';
import {
    findChildren,
    findParentNode,
    findParentNodeClosestToPos,
    findSelectedNodeOfType,
} from 'prosemirror-utils';
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view';

import {throttle} from '../../../../lodash';
import {
    isTableBodyNode,
    isTableCellNode,
    isTableNode,
    isTableRowNode,
} from '../../../../table-utils';
import {YfmTableNode} from '../const';

import {viewB, yfmTableView} from './view';
import {yfmTableCellCn, yfmTableCellView} from './yfmTableCellView';

export const tableControlsPluginKey = new PluginKey('TableControlsPlugin');

type Meta = State | undefined;
type State = null | {
    upper: {from: number; to: number};
    left: {from: number; to: number};
};

function shouldUpdateState(prev: State, curr: State): boolean {
    if (prev === null && curr === null) return false;
    if (prev === null || curr === null) return true;
    if (
        prev.left.from === curr.left.from &&
        prev.left.to === curr.left.to &&
        prev.upper.from === curr.upper.from &&
        prev.upper.to === curr.upper.to
    )
        return false;
    return true;
}

export const tableControlsPlugin = () =>
    new Plugin<State>({
        key: tableControlsPluginKey,
        state: {
            init: () => null,
            apply: (tr, prev) => {
                const meta: Meta = tr.getMeta(tableControlsPluginKey);
                return meta === undefined ? prev : meta;
            },
        },
        props: {
            nodeViews: {
                [YfmTableNode.Table]: yfmTableView,
                [YfmTableNode.Cell]: yfmTableCellView,
            },
            decorations(state) {
                const pluginState = tableControlsPluginKey.getState(state);
                const parent =
                    findParentNode(isTableNode)(state.selection) ||
                    findSelectedNodeOfType(state.schema.nodes.yfm_table)(state.selection);
                if (!parent) return null;

                const decs = [
                    Decoration.node(parent.pos, parent.pos + parent.node.nodeSize, {
                        class: viewB('buttons-visible'),
                    }),
                ];

                if (pluginState) {
                    const {upper, left} = pluginState;
                    decs.unshift(
                        Decoration.node(left.from, left.to, {
                            class: yfmTableCellCn('left-visible'),
                        }),
                        Decoration.node(upper.from, upper.to, {
                            class: yfmTableCellCn('upper-visible'),
                        }),
                    );
                }

                return DecorationSet.create(state.doc, decs);
            },
            handleDOMEvents: {
                mousemove: throttle((view: EditorView, e: MouseEvent) => {
                    const prevState: State = tableControlsPluginKey.getState(view.state);
                    const pos = view.posAtCoords({left: e.x, top: e.y});
                    if (!pos) return false;

                    const cell = findParentNodeClosestToPos(
                        view.state.doc.resolve(pos.pos),
                        isTableCellNode,
                    );
                    const table = findParentNodeClosestToPos(
                        view.state.doc.resolve(pos.pos),
                        isTableBodyNode,
                    );

                    let state: State = null;

                    if (cell && table) {
                        const contentDom = view.domAtPos(cell.pos + 1).node as HTMLElement;
                        const rowNumber = contentDom.getAttribute('data-row-number');
                        const colNumber = contentDom.getAttribute('data-col-number');

                        const rows = findChildren(table.node, isTableRowNode);
                        const parentRow = rows[Number(rowNumber)];
                        const firstRow = rows[0];
                        const parentCol = findChildren(rows[0].node, isTableCellNode)[
                            Number(colNumber)
                        ];

                        const rowFrom = parentRow.pos + table.start;
                        const rowTo = parentRow.pos + parentRow.node.nodeSize + table.start;
                        const firstRowFrom = firstRow.pos + table.start;

                        state = {
                            upper: {
                                from: parentCol.pos + firstRowFrom + 1,
                                to: parentCol.pos + firstRowFrom + 1 + parentCol.node.nodeSize,
                            },
                            left: {
                                from: rowFrom,
                                to: rowTo,
                            },
                        };
                    }

                    if (shouldUpdateState(prevState, state)) {
                        view.dispatch(view.state.tr.setMeta(tableControlsPluginKey, state));
                    }

                    return false;
                }, 100),
            },
        },
    });

import {Fragment} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import {
    findParentNode,
    findParentNodeClosestToPos,
    findSelectedNodeOfType,
    // @ts-ignore // TODO: fix cjs build
} from 'prosemirror-utils';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

import {throttle} from '../../../../../lodash';
import {
    isTableBodyNode,
    isTableCellNode,
    isTableNode,
    isTableRowNode,
} from '../../../../../table-utils';
import {getChildrenOfNode} from '../../../../../utils';
import {YfmTableNode} from '../../YfmTableSpecs';

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

// TODO: split: plus buttons extension & cell controls extension
export const yfmTableControlsPlugin = () =>
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

                    const $pos = view.state.doc.resolve(pos.pos);
                    const cell = findParentNodeClosestToPos($pos, isTableCellNode);
                    const row = findParentNodeClosestToPos($pos, isTableRowNode);
                    const tbody = findParentNodeClosestToPos($pos, isTableBodyNode);

                    let state: State = null;

                    if (cell && row && tbody) {
                        const cellIndex = getChildrenOfNode(row.node).findIndex(
                            (child) => child.node === cell.node,
                        );
                        const firstRowCell = getChildrenOfNode(
                            tbody.node.firstChild || Fragment.empty,
                        )[cellIndex];

                        if (firstRowCell) {
                            const upperFrom = tbody.pos + 2 + firstRowCell.offset;
                            const upperTo = upperFrom + firstRowCell.node.nodeSize;

                            const leftFrom = row.pos;
                            const leftTo = row.pos + row.node.nodeSize;

                            state = {
                                upper: {from: upperFrom, to: upperTo},
                                left: {from: leftFrom, to: leftTo},
                            };
                        }
                    }

                    if (shouldUpdateState(prevState, state)) {
                        view.dispatch(view.state.tr.setMeta(tableControlsPluginKey, state));
                    }

                    return false;
                }, 100),
            },
        },
    });

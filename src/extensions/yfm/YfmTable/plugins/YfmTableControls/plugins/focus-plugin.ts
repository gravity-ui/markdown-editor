import {Plugin, PluginKey, type Transaction} from '#pm/state';
import {findParentNode, findParentNodeClosestToPos, findSelectedNodeOfType} from '#pm/utils';
import {Decoration, DecorationSet, type EditorView} from '#pm/view';
import {throttle} from 'src/lodash';
import {isTableCellNode, isTableNode} from 'src/table-utils';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableNode, yfmTableType} from '../../../YfmTableSpecs';
import {
    YfmTableDecorationType as DecoType,
    YfmTableDecorationTypeKey as decoTypeKey,
} from '../const';
import {yfmTableCellView} from '../nodeviews/yfm-table-cell-view';
import {yfmTableView} from '../nodeviews/yfm-table-view';

const pluginKey = new PluginKey<PluginState>('TableControlsPlugin');
const FOCUSED_CLASSNAME = 'yfm-table-focused';

type Meta = {newState: HoverState} | undefined;
type HoverState = null | {
    rowIdx: number;
    columnIdx: number;
    tablePos: number;
};
type PluginState = {
    hover: HoverState;
    activeTablePos: number | null;
    decorations: DecorationSet;
};

function shouldUpdateState(prev: HoverState, curr: HoverState): boolean {
    if (prev === null && curr === null) return false;
    if (prev === null || curr === null) return true;
    if (
        prev.rowIdx === curr.rowIdx &&
        prev.columnIdx === curr.columnIdx &&
        prev.tablePos === curr.tablePos
    )
        return false;
    return true;
}

export function hideHoverDecos(tr: Transaction) {
    const meta: Meta = {newState: null};
    return tr.setMeta(pluginKey, meta);
}

export const yfmTableFocusPlugin = () => {
    return new Plugin<PluginState>({
        key: pluginKey,
        state: {
            init() {
                return {hover: null, activeTablePos: null, decorations: DecorationSet.empty};
            },
            apply: (tr, prev) => {
                if (tr.selectionSet || tr.docChanged) {
                    const table =
                        findParentNode(isTableNode)(tr.selection) ||
                        findSelectedNodeOfType(yfmTableType(tr.doc.type.schema))(tr.selection);
                    if (table) {
                        const tableFrom = table.pos;
                        const tableTo = tableFrom + table.node.nodeSize;
                        const decos = prev.decorations
                            .map(tr.mapping, tr.doc)
                            .find(
                                tableFrom,
                                tableTo,
                                (spec) =>
                                    spec[decoTypeKey] === DecoType.ShowRowControl ||
                                    spec[decoTypeKey] === DecoType.ShowColumnControl,
                            );
                        return {
                            hover: null,
                            activeTablePos: table.pos,
                            decorations: DecorationSet.create(tr.doc, [
                                ...decos,
                                Decoration.node(
                                    table.pos,
                                    table.pos + table.node.nodeSize,
                                    {class: FOCUSED_CLASSNAME},
                                    {[decoTypeKey]: DecoType.FocusTable},
                                ),
                            ]),
                        };
                    } else {
                        return {
                            hover: null,
                            activeTablePos: null,
                            decorations: DecorationSet.empty,
                        };
                    }
                }

                const meta: Meta = tr.getMeta(pluginKey);
                if (meta) {
                    const plState = {...prev};
                    plState.decorations = plState.decorations.map(tr.mapping, tr.doc);
                    {
                        const decosToRemove = plState.decorations.find(
                            undefined,
                            undefined,
                            (spec) =>
                                spec[decoTypeKey] === DecoType.ShowRowControl ||
                                spec[decoTypeKey] === DecoType.ShowColumnControl,
                        );
                        plState.decorations = plState.decorations.remove(decosToRemove);
                    }
                    plState.hover = meta.newState;
                    if (plState.hover && plState.activeTablePos === plState.hover.tablePos) {
                        const table = tr.doc.nodeAt(plState.activeTablePos)!;
                        const tableDesc = TableDesc.create(table)!;
                        const rowCell = tableDesc.getRelativePosForCell(plState.hover.rowIdx, 0);
                        const columnCell = tableDesc.getRelativePosForCell(
                            0,
                            plState.hover.columnIdx,
                        );

                        if (rowCell.type === 'real') {
                            plState.decorations = plState.decorations.add(tr.doc, [
                                Decoration.node(
                                    plState.activeTablePos + rowCell.from,
                                    plState.activeTablePos + rowCell.to,
                                    {},
                                    {[decoTypeKey]: DecoType.ShowRowControl},
                                ),
                            ]);
                        }

                        if (columnCell.type === 'real') {
                            plState.decorations = plState.decorations.add(tr.doc, [
                                Decoration.node(
                                    plState.activeTablePos + columnCell.from,
                                    plState.activeTablePos + columnCell.to,
                                    {},
                                    {[decoTypeKey]: DecoType.ShowColumnControl},
                                ),
                            ]);
                        }
                    }
                    return plState;
                }

                return {...prev, decorations: prev.decorations.map(tr.mapping, tr.doc)};
            },
        },
        props: {
            nodeViews: {
                [YfmTableNode.Table]: yfmTableView,
                [YfmTableNode.Cell]: yfmTableCellView,
            },
            decorations(state) {
                return pluginKey.getState(state)?.decorations;
            },
            handleDOMEvents: {
                mousemove: throttle((view: EditorView, e: MouseEvent) => {
                    let hover: HoverState = null;

                    if (
                        e.target instanceof Element &&
                        e.target.closest('td') &&
                        e.target.closest(`.${FOCUSED_CLASSNAME}`)
                    ) {
                        const $pos =
                            (() => {
                                const td = e.target.closest('td');
                                const domPos = td && view.posAtDOM(td, 0);
                                return domPos === null ? null : view.state.doc.resolve(domPos);
                            })() ??
                            (() => {
                                const pos = view.posAtCoords({left: e.x, top: e.y});
                                return pos && view.state.doc.resolve(pos.pos);
                            })();

                        const tcell = $pos && findParentNodeClosestToPos($pos, isTableCellNode);
                        const table = $pos && findParentNodeClosestToPos($pos, isTableNode);

                        const tableDesc = table && TableDesc.create(table.node);
                        const cellInfo = tcell && tableDesc?.getCellInfo(tcell.node);

                        if (cellInfo) {
                            hover = {
                                tablePos: table!.pos,
                                rowIdx: cellInfo.row,
                                columnIdx: cellInfo.column,
                            } satisfies HoverState;

                            {
                                const rowFirstCell = tableDesc!.rowsDesc[hover.rowIdx].cells[0];
                                if (rowFirstCell.type === 'virtual')
                                    hover.rowIdx = rowFirstCell.rowspan![0];
                            }

                            {
                                const colFirstCell = tableDesc!.rowsDesc[0].cells[hover.columnIdx];
                                if (colFirstCell.type === 'virtual')
                                    hover.columnIdx = colFirstCell.colspan![1];
                            }
                        }
                    }

                    if (shouldUpdateState(pluginKey.getState(view.state)?.hover || null, hover)) {
                        const meta: Meta = {newState: hover};
                        view.dispatch(view.state.tr.setMeta(pluginKey, meta));
                    }
                }, 100),
            },
        },
    });
};

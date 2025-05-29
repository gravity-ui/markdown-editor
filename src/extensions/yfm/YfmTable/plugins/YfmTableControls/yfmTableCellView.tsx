import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    EllipsisVertical,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import {Button, DropdownMenu, Icon, Portal} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
// @ts-ignore // TODO: fix cjs build
import {type NodeWithPos, findParentNodeClosestToPos} from 'prosemirror-utils';
import type {EditorView, NodeView, NodeViewConstructor} from 'prosemirror-view';

import {cn} from '../../../../../classname';
import {bindActions} from '../../../../../core';
import {i18n} from '../../../../../i18n/yfm-table';
import {ErrorLoggerBoundary} from '../../../../../react-utils/ErrorBoundary';
import {getTableDimensions, isTableNode} from '../../../../../table-utils';
import {getChildByNode} from '../../../../../utils/node-children';
import {getChildrenOfNode} from '../../../../../utils/nodes';
import {getReactRendererFromState} from '../../../../behavior/ReactRenderer';
import {YfmTableAttr} from '../../const';

import {controlActions} from './actions';

import './yfmTableCellView.scss';

export const yfmTableCellCn = cn('table-cell-view');
const b = yfmTableCellCn;

interface Props {
    columnNumber: number;
    rowNumber: number;
    view: EditorView;
    getParentTable: () => NodeWithPos | undefined;
    isInFirstRow: boolean;
    isFirstInRow: boolean;
}

const Controls: React.FC<Props> = function Controls({
    columnNumber,
    rowNumber,
    view,
    getParentTable,
    isInFirstRow,
    isFirstInRow,
}) {
    const actions = bindActions(controlActions)(view);

    const controls: React.ReactElement[] = [];

    if (isFirstInRow) {
        controls.push(
            <DropdownMenu
                key={1}
                switcherWrapperClassName={b('left-button')}
                renderSwitcher={(props) => (
                    <Button view={'outlined'} size={'s'} qa="g-md-yfm-table-row-btn" {...props}>
                        <Icon data={EllipsisVertical} />
                    </Button>
                )}
                menuProps={{qa: 'g-md-yfm-table-row-menu'}}
                items={[
                    {
                        text: i18n('row.add.before'),
                        qa: 'g-md-yfm-table-action-add-row-before',
                        action: () =>
                            actions.appendRow.run({
                                tablePos: getParentTable()?.pos,
                                rowNumber,
                                direction: 'before',
                            }),
                        iconStart: <Icon data={ArrowUp} />,
                        disabled: !actions.appendRow.isEnable({
                            tablePos: getParentTable()?.pos,
                            rowNumber,
                            direction: 'before',
                        }),
                    },
                    {
                        text: i18n('row.add.after'),
                        qa: 'g-md-yfm-table-action-add-row-after',
                        action: () =>
                            actions.appendRow.run({
                                tablePos: getParentTable()?.pos,
                                rowNumber,
                                direction: 'after',
                            }),
                        iconStart: <Icon data={ArrowDown} />,
                        disabled: !actions.appendRow.isEnable({
                            tablePos: getParentTable()?.pos,
                            rowNumber,
                            direction: 'after',
                        }),
                    },
                    {
                        text: i18n('row.remove'),
                        qa: 'g-md-yfm-table-action-remove-row',
                        action: () =>
                            actions.deleteRow.run({
                                rowNumber,
                                tablePos: getParentTable()?.pos,
                            }),
                        iconStart: <Icon data={Xmark} />,
                        disabled: !actions.deleteRow.isEnable({
                            rowNumber,
                            tablePos: getParentTable()?.pos,
                        }),
                    },
                    {
                        theme: 'danger',
                        text: i18n('table.remove'),
                        qa: 'g-md-yfm-table-action-remove-table',
                        action: () =>
                            actions.deleteTable.run({
                                tablePos: getParentTable()?.pos,
                                tableNode: getParentTable()?.node,
                            }),
                        iconStart: <Icon data={TrashBin} />,
                        disabled: !actions.deleteTable.isEnable({
                            tablePos: getParentTable()?.pos,
                            tableNode: getParentTable()?.node,
                        }),
                    },
                ]}
            />,
        );
    }

    if (isInFirstRow) {
        controls.push(
            <DropdownMenu
                key={2}
                switcherWrapperClassName={b('upper-button')}
                renderSwitcher={(props) => (
                    <Button view={'outlined'} size={'s'} qa="g-md-yfm-table-column-btn" {...props}>
                        <Icon data={EllipsisVertical} />
                    </Button>
                )}
                menuProps={{qa: 'g-md-yfm-table-column-menu'}}
                items={[
                    {
                        text: i18n('column.add.before'),
                        qa: 'g-md-yfm-table-action-add-column-before',
                        action: () =>
                            actions.appendColumn.run({
                                tablePos: getParentTable()?.pos,
                                columnNumber,
                                direction: 'before',
                            }),
                        iconStart: <Icon data={ArrowLeft} />,
                        disabled: !actions.appendColumn.isEnable({
                            tablePos: getParentTable()?.pos,
                            columnNumber,
                            direction: 'before',
                        }),
                    },
                    {
                        text: i18n('column.add.after'),
                        qa: 'g-md-yfm-table-action-add-column-after',
                        action: () =>
                            actions.appendColumn.run({
                                tablePos: getParentTable()?.pos,
                                columnNumber,
                                direction: 'after',
                            }),
                        iconStart: <Icon data={ArrowRight} />,
                        disabled: !actions.appendColumn.isEnable({
                            tablePos: getParentTable()?.pos,
                            columnNumber,
                            direction: 'after',
                        }),
                    },
                    {
                        text: i18n('column.remove'),
                        qa: 'g-md-yfm-table-action-remove-column',
                        action: () =>
                            actions.deleteColumn.run({
                                columnNumber,
                                tablePos: getParentTable()?.pos,
                            }),
                        iconStart: <Icon data={Xmark} />,
                        disabled: !actions.deleteColumn.isEnable({
                            columnNumber,
                            tablePos: getParentTable()?.pos,
                        }),
                    },
                    {
                        theme: 'danger',
                        text: i18n('table.remove'),
                        qa: 'g-md-yfm-table-action-remove-table',
                        action: () =>
                            actions.deleteTable.run({
                                tablePos: getParentTable()?.pos,
                                tableNode: getParentTable()?.node,
                            }),
                        iconStart: <Icon data={TrashBin} />,
                        disabled: !actions.deleteTable.isEnable({
                            tablePos: getParentTable()?.pos,
                            tableNode: getParentTable()?.node,
                        }),
                    },
                ]}
            />,
        );
    }

    return controls.length ? <>{controls}</> : null;
};

export const yfmTableCellView: NodeViewConstructor = (node, view, getPos): NodeView => {
    const getParentTable = () =>
        findParentNodeClosestToPos(view.state.doc.resolve(getPos()!), isTableNode);

    const parentTable = getParentTable();

    const cellCoords = parentTable ? findCellCoords(parentTable.node, node) : null;

    // @ts-expect-error
    if (!cellCoords) return {};

    const {cellIndex, rowIndex} = cellCoords;
    const isFirstRow = rowIndex === 0;
    const isFirstColumn = cellIndex === 0;

    if (!isFirstRow && !isFirstColumn) {
        // in this case, we don't need custom nodeView.
        // @ts-expect-error
        return {};
    }

    const dom = document.createElement('td');
    if (node.attrs[YfmTableAttr.Colspan])
        dom.setAttribute('colspan', node.attrs[YfmTableAttr.Colspan]);
    if (node.attrs[YfmTableAttr.Rowspan])
        dom.setAttribute('rowspan', node.attrs[YfmTableAttr.Rowspan]);
    if (node.attrs[YfmTableAttr.CellAlign]) {
        dom.classList.add(node.attrs[YfmTableAttr.CellAlign]);
        dom.setAttribute(YfmTableAttr.CellAlign, node.attrs[YfmTableAttr.Rowspan]);
    }

    const contentDOM = document.createElement('div');
    const control = document.createElement('span');
    control.setAttribute('style', 'width: 0; height: 0; float: left;');
    dom.setAttribute('style', 'position: relative; overflow: visible;');

    dom.appendChild(contentDOM);
    dom.appendChild(control);

    const renderItem = getReactRendererFromState(view.state).createItem(
        'yfm-table-cell-view',
        () => (
            <Portal container={control}>
                <ErrorLoggerBoundary>
                    <Controls
                        columnNumber={cellIndex}
                        rowNumber={rowIndex}
                        isFirstInRow={isFirstColumn}
                        isInFirstRow={isFirstRow}
                        getParentTable={getParentTable}
                        view={view}
                    />
                </ErrorLoggerBoundary>
            </Portal>
        ),
    );

    return {
        dom,
        contentDOM,
        destroy() {
            renderItem.remove();
        },
        ignoreMutation(mutation) {
            return mutation.target === control || control.contains(mutation.target);
        },
        update(n) {
            const {rows: nRows, cols: nCols} = getTableDimensions(n);
            const {rows, cols} = getTableDimensions(node);

            return !(rows !== nRows || cols !== nCols);
        },
    };
};

function findCellCoords(table: Node, cell: Node) {
    if (!table.lastChild) return null;
    const rows = getChildrenOfNode(table.lastChild); // children of tBody
    for (const row of rows) {
        const node = getChildByNode(row.node, cell);
        if (node) {
            return {
                rowIndex: row.index,
                cellIndex: node.index,
            };
        }
    }
    return null;
}

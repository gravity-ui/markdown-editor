import React from 'react';

import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    EllipsisVertical,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import {Button, DropdownMenu, Icon} from '@gravity-ui/uikit';
import {NodeWithPos, findChildren, findParentNodeClosestToPos} from 'prosemirror-utils';
import {EditorView, NodeView, NodeViewConstructor} from 'prosemirror-view';
import {createPortal} from 'react-dom';

import {cn} from '../../../../../classname';
import {bindActions} from '../../../../../core';
import {i18n} from '../../../../../i18n/yfm-table';
import {ErrorLoggerBoundary} from '../../../../../react-utils/ErrorBoundary';
import {
    getTableDimensions,
    isTableCellNode,
    isTableNode,
    isTableRowNode,
} from '../../../../../table-utils';
import {getReactRendererFromState} from '../../../../behavior/ReactRenderer';

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
                switcher={
                    <Button view={'outlined'} size={'s'}>
                        <Icon data={EllipsisVertical} />
                    </Button>
                }
                items={[
                    {
                        text: i18n('row.add.before'),
                        action: () =>
                            actions.appendRow.run({
                                tablePos: getParentTable()?.pos,
                                rowNumber,
                                direction: 'before',
                            }),
                        icon: <Icon data={ArrowUp} />,
                        disabled: !actions.appendRow.isEnable({
                            tablePos: getParentTable()?.pos,
                            rowNumber,
                            direction: 'before',
                        }),
                    },
                    {
                        text: i18n('row.add.after'),
                        action: () =>
                            actions.appendRow.run({
                                tablePos: getParentTable()?.pos,
                                rowNumber,
                                direction: 'after',
                            }),
                        icon: <Icon data={ArrowDown} />,
                        disabled: !actions.appendRow.isEnable({
                            tablePos: getParentTable()?.pos,
                            rowNumber,
                            direction: 'after',
                        }),
                    },
                    {
                        text: i18n('row.remove'),
                        action: () =>
                            actions.deleteRow.run({
                                rowNumber,
                                tablePos: getParentTable()?.pos,
                            }),
                        icon: <Icon data={Xmark} />,
                        disabled: !actions.deleteRow.isEnable({
                            rowNumber,
                            tablePos: getParentTable()?.pos,
                        }),
                    },
                    {
                        theme: 'danger',
                        text: i18n('table.remove'),
                        action: () =>
                            actions.deleteTable.run({
                                tablePos: getParentTable()?.pos,
                                tableNode: getParentTable()?.node,
                            }),
                        icon: <Icon data={TrashBin} />,
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
                switcher={
                    <Button view={'outlined'} size={'s'}>
                        <Icon data={EllipsisVertical} />
                    </Button>
                }
                items={[
                    {
                        text: i18n('column.add.before'),
                        action: () =>
                            actions.appendColumn.run({
                                tablePos: getParentTable()?.pos,
                                columnNumber,
                                direction: 'before',
                            }),
                        icon: <Icon data={ArrowLeft} />,
                        disabled: !actions.appendColumn.isEnable({
                            tablePos: getParentTable()?.pos,
                            columnNumber,
                            direction: 'before',
                        }),
                    },
                    {
                        text: i18n('column.add.after'),
                        action: () =>
                            actions.appendColumn.run({
                                tablePos: getParentTable()?.pos,
                                columnNumber,
                                direction: 'after',
                            }),
                        icon: <Icon data={ArrowRight} />,
                        disabled: !actions.appendColumn.isEnable({
                            tablePos: getParentTable()?.pos,
                            columnNumber,
                            direction: 'after',
                        }),
                    },
                    {
                        text: i18n('column.remove'),
                        action: () =>
                            actions.deleteColumn.run({
                                columnNumber,
                                tablePos: getParentTable()?.pos,
                            }),
                        icon: <Icon data={Xmark} />,
                        disabled: !actions.deleteColumn.isEnable({
                            columnNumber,
                            tablePos: getParentTable()?.pos,
                        }),
                    },
                    {
                        theme: 'danger',
                        text: i18n('table.remove'),
                        action: () =>
                            actions.deleteTable.run({
                                tablePos: getParentTable()?.pos,
                                tableNode: getParentTable()?.node,
                            }),
                        icon: <Icon data={TrashBin} />,
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
    const dom = document.createElement('td');
    const contentDOM = document.createElement('div');
    const control = document.createElement('span');
    control.setAttribute('style', 'width: 0; height: 0; float: left;');

    dom.setAttribute('style', 'position: relative; overflow: visible;');

    const getParentTable = () =>
        findParentNodeClosestToPos(view.state.doc.resolve(getPos()!), isTableNode);
    const parentTable = getParentTable();

    // @ts-expect-error
    if (!parentTable) return {};

    const rowNodes = findChildren(parentTable?.node, isTableRowNode);

    const relativeCelPos = getPos()! - parentTable?.pos;

    const rowNumber = rowNodes.findIndex(
        (_v, i) =>
            relativeCelPos > rowNodes[i].pos &&
            relativeCelPos < (rowNodes[i + 1]?.pos || Number.MAX_SAFE_INTEGER),
    );

    const parentRow = rowNodes[rowNumber];

    const columnNumber = findChildren(parentRow.node, isTableCellNode).findIndex((c) => {
        return c.pos === relativeCelPos - parentRow.pos - 2;
    });

    const isFirstInRow = rowNodes.findIndex((r) => r.pos === relativeCelPos - 2) >= 0;

    dom.appendChild(contentDOM);
    dom.appendChild(control);

    const renderItem = getReactRendererFromState(view.state).createItem('yfm-table-cell-view', () =>
        createPortal(
            <ErrorLoggerBoundary>
                <Controls
                    columnNumber={columnNumber}
                    rowNumber={rowNumber}
                    isFirstInRow={isFirstInRow}
                    isInFirstRow={rowNumber === 0}
                    getParentTable={getParentTable}
                    view={view}
                />
            </ErrorLoggerBoundary>,
            control,
        ),
    );

    contentDOM.setAttribute('data-row-number', String(rowNumber));
    contentDOM.setAttribute('data-col-number', String(columnNumber));

    return {
        dom,
        contentDOM,
        destroy() {
            renderItem.remove();
        },
        ignoreMutation(mutation) {
            return mutation.type === 'childList' && mutation.target === control;
        },
        update(n) {
            const {rows: nRows, cols: nCols} = getTableDimensions(n);
            const {rows, cols} = getTableDimensions(node);

            return !(rows !== nRows || cols !== nCols);
        },
    };
};

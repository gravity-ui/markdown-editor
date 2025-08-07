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
// @ts-ignore // TODO: fix cjs build
import {type NodeWithPos, findParentNodeClosestToPos} from 'prosemirror-utils';
import type {EditorView, NodeView, NodeViewConstructor} from 'prosemirror-view';

import {bindActions} from '#core';
import {cn} from 'src/classname';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {i18n} from 'src/i18n/yfm-table';
import {ErrorLoggerBoundary} from 'src/react-utils/ErrorBoundary';
import {getTableDimensions, isTableNode} from 'src/table-utils';
import {TableDesc} from 'src/table-utils/table-desc';

import {YfmTableAttr} from '../../const';

import {controlActions} from './actions';
import {YfmTableDnDHandler} from './dnd';
import {GripPopup} from './popup';

import './yfmTableCellView.scss';

export const yfmTableCellCn = cn('table-cell-view');
// const b = yfmTableCellCn;

interface Props {
    acnhorElement: HTMLElement;
    columnNumber: number;
    rowNumber: number;
    view: EditorView;
    dndHandler: YfmTableDnDHandler;
    getParentTable: () => NodeWithPos | undefined;
    forColumn: boolean;
    forRow: boolean;
}

const Controls: React.FC<Props> = function Controls({
    acnhorElement,
    columnNumber,
    rowNumber,
    view,
    dndHandler,
    getParentTable,
    forColumn,
    forRow,
}) {
    const actions = bindActions(controlActions)(view);

    const controls: React.ReactElement[] = [];

    if (forRow) {
        controls.push(
            <GripPopup
                open
                // keepMounted
                // disableTransition
                anchorElement={acnhorElement}
                placement="left"
                offset={{mainAxis: -8}}
                // initialFocus={-1}
                // returnFocus={false}
                // modal={false}
                style={{
                    '--g-popup-border-width': 0,
                    '--g-popup-border-color': 'none',
                    // '--g-popup-background-color': 'transparent',
                }}
            >
                <DropdownMenu
                    key={1}
                    // switcherWrapperClassName={b('left-button')}
                    renderSwitcher={(props) => (
                        <Button
                            style={{
                                '--g-button-height': '16px',
                                '--g-button-border-radius': '3px',
                            }}
                            view={'outlined'}
                            size={'s'}
                            qa="g-md-yfm-table-row-btn"
                            {...props}
                            onMouseDown={dndHandler.row.control_handleMouseDown}
                            onMouseMove={dndHandler.row.control_handleMouseMove}
                            onMouseUp={dndHandler.row.control_handleMouseUp}
                        >
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
                />
            </GripPopup>,
        );
    }

    if (forColumn) {
        controls.push(
            <GripPopup
                open
                // keepMounted
                // disableTransition
                offset={{mainAxis: -8}}
                anchorElement={acnhorElement}
                placement="top"
                // initialFocus={-1}
                // returnFocus={false}
                // modal={false}
                style={{
                    '--g-popup-border-width': 0,
                    '--g-popup-border-color': 'none',
                    // '--g-popup-background-color': 'transparent',
                }}
            >
                <DropdownMenu
                    key={2}
                    // switcherWrapperClassName={b('upper-button')}
                    renderSwitcher={(props) => (
                        <Button
                            style={{
                                transform: 'rotate(90deg)',
                                '--g-button-height': '16px',
                                '--g-button-border-radius': '3px',
                            }}
                            view={'outlined'}
                            size={'s'}
                            qa="g-md-yfm-table-column-btn"
                            {...props}
                            onMouseDown={dndHandler.column.control_handleMouseDown}
                            onMouseMove={dndHandler.column.control_handleMouseMove}
                            onMouseUp={dndHandler.column.control_handleMouseUp}
                        >
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
                />
            </GripPopup>,
        );
    }

    return controls.length ? <>{controls}</> : null;
};

export const yfmTableCellView: NodeViewConstructor = (node, view, getPos): NodeView => {
    const getParentTable = () =>
        findParentNodeClosestToPos(view.state.doc.resolve(getPos()!), isTableNode);

    const parentTable = getParentTable();
    if (!parentTable)
        // @ts-expect-error
        return {};

    const tableDesc = TableDesc.create(parentTable.node);
    const cellInfo = tableDesc?.getCellInfo(node);

    if (!cellInfo)
        // @ts-expect-error
        return {};

    const {row: rowIndex, column: columnIndex} = cellInfo;
    const isFirstRow = rowIndex === 0;
    const isFirstColumn = columnIndex === 0;

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

    const dndHandler = new YfmTableDnDHandler(view, {node, getPos});

    const renderItem = getReactRendererFromState(view.state).createItem(
        'yfm-table-cell-view',
        () => (
            // <Portal container={control}>
            <ErrorLoggerBoundary>
                <Controls
                    acnhorElement={dom}
                    columnNumber={columnIndex}
                    rowNumber={rowIndex}
                    forRow={isFirstColumn}
                    forColumn={isFirstRow}
                    dndHandler={dndHandler}
                    getParentTable={getParentTable}
                    view={view}
                />
            </ErrorLoggerBoundary>
            // </Portal>
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
        update(n, decorations) {
            dndHandler.update(n);

            const {rows: nRows, cols: nCols} = getTableDimensions(n);
            const {rows, cols} = getTableDimensions(node);

            if (!(rows !== nRows || cols !== nCols)) {
                renderItem.rerender();
                return true;
            }
            return false;
        },
    };
};

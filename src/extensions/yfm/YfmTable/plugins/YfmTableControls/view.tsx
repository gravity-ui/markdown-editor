import {Button, Portal} from '@gravity-ui/uikit';

import {cn} from '../../../../../classname';
import {type NodeViewConstructor, bindActions} from '../../../../../core';
import {ErrorLoggerBoundary} from '../../../../../react-utils/ErrorBoundary';
import {getTableDimensions} from '../../../../../table-utils';
import {getReactRendererFromState} from '../../../../behavior/ReactRenderer';

import {controlActions} from './actions';

import './view.scss';

const wrapperB = cn('table-wrapper');
export const viewB = cn('table-view');

export const yfmTableView: NodeViewConstructor = (node, view, getPos) => {
    const actions = bindActions(controlActions)(view);

    const wrapperElem = document.createElement('div');
    wrapperElem.classList.add(wrapperB());
    wrapperElem.dataset.qa = 'g-md-yfm-table-wrapper';

    const tableElem = document.createElement('table');
    tableElem.classList.add(viewB());

    const viewElem = document.createElement('div');
    viewElem.classList.add(viewB('wrapper'));

    const controls = document.createElement('div');
    controls.setAttribute('contenteditable', 'false');

    const hackStrip = document.createElement('div');
    // this is a strip of a table height. it's a hack so that content of table doesn't get outside of editor borders
    // and thus editing buttons are not cropped
    hackStrip.classList.add(viewB('hack-strip'));

    viewElem.appendChild(hackStrip);
    viewElem.appendChild(tableElem);
    viewElem.appendChild(controls);
    wrapperElem.appendChild(viewElem);

    const components = [
        <div className={viewB('plus-button-controls', {bottom: true})} key={1}>
            <Button
                onClick={() => {
                    actions.appendRow.run({tablePos: getPos()});
                }}
                className={viewB('plus-button', {bottom: true})}
                view={'normal'}
                qa="g-md-yfm-table-plus-row"
            >
                +
            </Button>
        </div>,
        <div className={viewB('plus-button-controls', {right: true})} key={2}>
            <Button
                onClick={() => {
                    actions.appendColumn.run({tablePos: getPos()});
                }}
                className={viewB('plus-button', {right: true})}
                view={'normal'}
                qa="g-md-yfm-table-plus-column"
            >
                +
            </Button>
        </div>,
    ];

    const renderItem = getReactRendererFromState(view.state).createItem(
        'yfm-table-plus-buttons',
        () => (
            <Portal container={controls}>
                <ErrorLoggerBoundary>{components}</ErrorLoggerBoundary>
            </Portal>
        ),
    );

    return {
        dom: wrapperElem,
        contentDOM: tableElem,
        destroy() {
            renderItem.remove();
            viewElem.remove();
        },
        update(n) {
            const {rows: nRows, cols: nCols} = getTableDimensions(n);
            const {rows, cols} = getTableDimensions(node);
            return !(rows !== nRows || cols !== nCols);
        },
        ignoreMutation(mutation) {
            return (
                mutation.type === 'childList' &&
                (mutation.target === controls || controls.contains(mutation.target))
            );
        },
    };
};

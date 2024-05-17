import React from 'react';

import {NodeType} from 'prosemirror-model';
import {PluginView} from 'prosemirror-state';
import {findParentDomRefOfType} from 'prosemirror-utils';
import {EditorView} from 'prosemirror-view';

import {ErrorLoggerBoundary} from '../../../../../react-utils/ErrorBoundary';
import {getReactRendererFromState} from '../../../../behavior/ReactRenderer';

import {TableCellFloatingButton, TableCellFloatingButtonActions} from './floating';

type MixedNodeType = NodeType | NodeType[];
export class TableCellContextView implements PluginView {
    private static findCellDom(view: EditorView, nodeType: MixedNodeType) {
        return findParentDomRefOfType(nodeType, view.domAtPos.bind(view))(view.state.selection) as
            | Element
            | undefined;
    }

    #view;
    #actions;
    #nodeType;
    #renderItem;

    constructor(
        view: EditorView,
        actions: TableCellFloatingButtonActions,
        cellNodeType: MixedNodeType,
    ) {
        this.#view = view;
        this.#actions = actions;
        this.#nodeType = cellNodeType;

        this.#renderItem = getReactRendererFromState(view.state).createItem(
            'table-cell-tooltip',
            () => (
                <ErrorLoggerBoundary>
                    <TableCellFloatingButton
                        actions={this.#actions}
                        dom={TableCellContextView.findCellDom(this.#view, this.#nodeType)}
                    />
                </ErrorLoggerBoundary>
            ),
        );
    }

    update(view: EditorView) {
        this.#view = view;
        this.#renderItem.rerender();
    }

    destroy() {
        this.#renderItem.remove();
    }
}

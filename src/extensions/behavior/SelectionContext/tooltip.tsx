import React from 'react';

import {Popup, PopupProps} from '@gravity-ui/uikit';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {ActionStorage} from '../../../core';
import {isFunction} from '../../../lodash';
import {logger} from '../../../logger';
import {ErrorLoggerBoundary} from '../../../react-utils/ErrorBoundary';
import {Toolbar, ToolbarGroupItemData, ToolbarProps} from '../../../toolbar';
import {RendererItem, getReactRendererFromState} from '../ReactRenderer';

type SelectionTooltipBaseProps = {
    show?: boolean;
    poppupProps: PopupProps;
};
type SelectionTooltipProps = SelectionTooltipBaseProps & ToolbarProps<ActionStorage>;

const SelectionTooltip: React.FC<SelectionTooltipProps> = ({
    show,
    poppupProps,
    ...toolbarProps
}) => {
    if (!show) return null;
    return (
        <Popup open {...poppupProps} style={{padding: '4px 8px'}}>
            <Toolbar {...toolbarProps} />
        </Popup>
    );
};

export type ContextGroupItemData = ToolbarGroupItemData<ActionStorage> & {
    condition?: (state: EditorState) => void;
};
export type ContextGroupData = ContextGroupItemData[];
export type ContextConfig = ContextGroupData[];

export class TooltipView {
    #isTooltipOpen = false;

    private actions: ActionStorage;
    private menuConfig: ContextConfig;

    private view!: EditorView;
    private baseProps: SelectionTooltipBaseProps = {show: false, poppupProps: {}};
    private _tooltipRenderItem: RendererItem | null = null;

    constructor(actions: ActionStorage, menuConfig: ContextConfig) {
        this.actions = actions;
        this.menuConfig = menuConfig;
    }

    get isTooltipOpen(): boolean {
        return this.#isTooltipOpen;
    }

    show(view: EditorView, popupProps?: PopupProps) {
        this.view = view;
        this.#isTooltipOpen = true;
        this.baseProps = {
            show: true,
            poppupProps: {
                ...popupProps,
                ...this.calcPosition(view),
            },
        };
        this.renderPopup();
    }

    hide(view: EditorView) {
        this.view = view;
        this.#isTooltipOpen = false;
        this.baseProps = {show: false, poppupProps: {}};
        this.renderPopup();
    }

    destroy() {
        this._tooltipRenderItem?.remove();
        this._tooltipRenderItem = null;
    }

    private getSelectionTooltipProps(): SelectionTooltipProps {
        return {
            ...this.baseProps,
            focus: () => this.view.focus(),
            data: this.getFilteredConfig(),
            editor: this.actions,
            onClick: (id) => logger.action({mode: 'wysiwyg', source: 'context-menu', action: id}),
        };
    }

    private getFilteredConfig(): ContextConfig {
        return this.baseProps.show
            ? this.menuConfig
                  .map((groupData) =>
                      groupData.filter(({condition}) =>
                          isFunction(condition) ? condition(this.view.state) : true,
                      ),
                  )
                  .filter((groupData) => Boolean(groupData.length))
            : [];
    }

    private renderPopup() {
        this.tooltipRenderItem.rerender();
    }

    private get tooltipRenderItem() {
        if (!this._tooltipRenderItem) {
            const reactRenderer = getReactRendererFromState(this.view.state);
            this._tooltipRenderItem = reactRenderer.createItem('selection_context', () => (
                <ErrorLoggerBoundary>
                    <SelectionTooltip {...this.getSelectionTooltipProps()} />
                </ErrorLoggerBoundary>
            ));
        }
        return this._tooltipRenderItem;
    }

    private calcPosition(view: EditorView): PopupProps {
        const viewDom = view.dom as Element;
        // The box in which the tooltip is positioned, to use as base
        const viewBox = viewDom.getBoundingClientRect();

        const viewWidth = viewBox.right - viewBox.left;
        const viewHalfWidth = viewWidth / 2;

        // These are in screen coordinates
        const start = view.coordsAtPos(view.state.selection.from);
        const end = view.coordsAtPos(view.state.selection.to);

        // Find a center-ish x position from the selection endpoints (when
        // crossing lines, end may be more to the left)
        const left = Math.max((start.left + end.left) / 2, start.left + 3);

        const leftOffset = left - (viewBox.left + viewHalfWidth);
        const bottomOffset = -(viewBox.bottom - end.bottom) + this.popupTextOffset;

        return {
            placement: 'bottom',
            anchorRef: {current: viewDom},
            offset: [leftOffset, bottomOffset],
        };
    }

    private get popupTextOffset() {
        return 4; // 4px offset from text selection
    }
}

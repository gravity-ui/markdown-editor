import type {VirtualElement} from '@floating-ui/react';
import type {PopupPlacement, PopupProps} from '@gravity-ui/uikit';
import type {EditorView} from 'prosemirror-view';

import type {ActionStorage} from '../../../core';
import {type Logger2, globalLogger} from '../../../logger';
import {ErrorLoggerBoundary} from '../../../react-utils/ErrorBoundary';
import {type RendererItem, getReactRendererFromState} from '../ReactRenderer';

import {TextSelectionTooltip} from './TextSelectionTooltip';
import type {ContextConfig} from './types';

export type {ContextGroupItemData, ContextGroupData, ContextConfig} from './types';

export type TooltipViewParams = {
    /** @default 'bottom' */
    placement?: 'top' | 'bottom';
    /** @default false */
    flip?: boolean;
    onPopupOpenChange: PopupProps['onOpenChange'];
};

export class TooltipView {
    #isTooltipOpen = false;

    private readonly logger: Logger2.ILogger;
    private readonly actions: ActionStorage;
    private readonly menuConfig: ContextConfig;
    private readonly placement: PopupPlacement;
    private readonly onPopupOpenChange: PopupProps['onOpenChange'];

    private view!: EditorView;
    private visible = false;
    private anchor: PopupProps['anchorElement'] = undefined;
    private _tooltipRenderItem: RendererItem | null = null;

    constructor(
        actions: ActionStorage,
        menuConfig: ContextConfig,
        logger: Logger2.ILogger,
        params: TooltipViewParams,
    ) {
        this.logger = logger;
        this.actions = actions;
        this.menuConfig = menuConfig;

        const {flip, placement = 'bottom', onPopupOpenChange} = params;
        this.placement = flip ? placement : [placement];
        this.onPopupOpenChange = onPopupOpenChange;
    }

    get isTooltipOpen(): boolean {
        return this.#isTooltipOpen;
    }

    show(view: EditorView) {
        this.view = view;
        this.#isTooltipOpen = true;
        this.visible = true;
        this.anchor ??= this.createVirtualElement(view);
        this.renderPopup();
    }

    hide(view: EditorView) {
        this.view = view;

        // do not rerender popup if it is already hidden
        if (!this.#isTooltipOpen && !this.visible) return;

        this.#isTooltipOpen = false;
        this.visible = false;
        this.anchor = undefined;
        this.renderPopup();
    }

    destroy() {
        this._tooltipRenderItem?.remove();
        this._tooltipRenderItem = null;
    }

    private readonly handleFocus = () => this.view.focus();
    private readonly handleClick = (id: string) => {
        globalLogger.action({mode: 'wysiwyg', source: 'context-menu', action: id});
        this.logger.action({source: 'context-menu', action: id});
    };

    private renderPopup() {
        this.tooltipRenderItem.rerender();
    }

    private get tooltipRenderItem() {
        if (!this._tooltipRenderItem) {
            const reactRenderer = getReactRendererFromState(this.view.state);
            this._tooltipRenderItem = reactRenderer.createItem('selection_context', () => {
                if (!this.visible) return null;
                return (
                    <ErrorLoggerBoundary>
                        <TextSelectionTooltip
                            config={this.menuConfig}
                            editor={this.actions}
                            editorView={this.view}
                            focus={this.handleFocus}
                            onClick={this.handleClick}
                            popupPlacement={this.placement}
                            popupAnchor={this.anchor}
                            popupOnOpenChange={this.onPopupOpenChange}
                        />
                    </ErrorLoggerBoundary>
                );
            });
        }
        return this._tooltipRenderItem;
    }

    private createVirtualElement(view: EditorView): VirtualElement {
        return {
            getBoundingClientRect() {
                // These are in screen coordinates
                const start = view.coordsAtPos(view.state.selection.from);
                const end = view.coordsAtPos(view.state.selection.to);
                // Find a center-ish x position from the selection endpoints (when
                // crossing lines, end may be more to the left)
                const yCenter = Math.max((start.left + end.left) / 2, start.left + 3);

                const top = start.top;
                const left = yCenter - 1;
                const width = 2;
                const height = end.bottom - start.top;

                return {
                    top,
                    left,
                    right: left + width,
                    bottom: top + height,
                    y: top,
                    x: left,
                    height,
                    width,
                };
            },
        };
    }
}

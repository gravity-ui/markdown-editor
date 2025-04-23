import type {VirtualElement} from '@floating-ui/react'; // eslint-disable-line import/no-extraneous-dependencies
import {Popup, type PopupPlacement, type PopupProps} from '@gravity-ui/uikit';
import type {EditorState} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {ActionStorage} from '../../../core';
import {isFunction} from '../../../lodash';
import {type Logger2, globalLogger} from '../../../logger';
import {ErrorLoggerBoundary} from '../../../react-utils/ErrorBoundary';
import {Toolbar} from '../../../toolbar';
import type {
    ToolbarButtonPopupData,
    ToolbarGroupItemData,
    ToolbarProps,
    ToolbarSingleItemData,
} from '../../../toolbar';
import {type RendererItem, getReactRendererFromState} from '../ReactRenderer';

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

export type ContextGroupItemData =
    | (ToolbarGroupItemData<ActionStorage> & {
          condition?: (state: EditorState) => void;
      })
    | ((ToolbarSingleItemData<ActionStorage> | ToolbarButtonPopupData<ActionStorage>) & {
          condition?: 'enabled';
      });

export type ContextGroupData = ContextGroupItemData[];
export type ContextConfig = ContextGroupData[];

export type TooltipViewParams = {
    /** @default 'bottom' */
    placement?: 'top' | 'bottom';
    /** @default false */
    flip?: boolean;
};

export class TooltipView {
    #isTooltipOpen = false;

    private readonly logger: Logger2.ILogger;
    private readonly actions: ActionStorage;
    private readonly menuConfig: ContextConfig;
    private readonly placement: PopupPlacement;

    private view!: EditorView;
    private baseProps: SelectionTooltipBaseProps = {show: false, poppupProps: {}};
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

        const {flip, placement = 'bottom'} = params;
        this.placement = flip ? placement : [placement];
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
            onClick: (id) => {
                globalLogger.action({mode: 'wysiwyg', source: 'context-menu', action: id});
                this.logger.action({source: 'context-menu', action: id});
            },
        };
    }

    private getFilteredConfig(): ContextConfig {
        return this.baseProps.show
            ? this.menuConfig
                  .map((groupData) =>
                      groupData.filter((item) => {
                          const {condition} = item;
                          if (condition === 'enabled') {
                              return item.isEnable(this.actions);
                          }
                          if (isFunction(condition)) {
                              return condition(this.view.state);
                          }
                          return true;
                      }),
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
        const virtualElem: VirtualElement = {
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

        return {
            placement: this.placement,
            anchorElement: virtualElem,
        };
    }
}

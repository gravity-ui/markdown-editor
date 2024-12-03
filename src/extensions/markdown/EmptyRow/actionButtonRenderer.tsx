import React from 'react';

import {Popup, PopupProps} from '@gravity-ui/uikit';

import {uniqueId} from '../../../lodash';
import {ReactRenderer, RendererItem} from '../../behavior';

import {ActionButtonButton} from './actionButton';

import './actionButtonRenderer.scss';

export type ActionButtonRendererOptions = {
    reactRenderer: ReactRenderer;
    handler: ActionButtonEventHandler;
};

type RenderProps = {
    open?: boolean;
    anchor: Element;
    handler: ActionButtonEventHandler;
    props?: ActionButtonExtraProps;
};

export type ActionButtonExtraProps = Pick<PopupProps, 'offset' | 'placement'>;

type ActionButtonRenderItem = {
    open: boolean;
    readonly id: string;
    readonly anchor: Element;
    props?: ActionButtonExtraProps;
};

type HTMLAttrs = React.HTMLAttributes<HTMLElement>;

export interface ActionButtonEventHandler {
    handleActionButtonClick: NonNullable<HTMLAttrs['onClick']>;
    handleActionButtonMouseLeave: NonNullable<HTMLAttrs['onMouseLeave']>;
}

/**
 * Рисует кнопку с точками возле нод редактора
 */
export class ActionButtonRenderer {
    private readonly _eventHandler: ActionButtonEventHandler;

    private readonly _renderItem: RendererItem;

    private readonly _actionButtonList = new Map<Element, ActionButtonRenderItem>();

    constructor({reactRenderer, handler}: ActionButtonRendererOptions) {
        this._eventHandler = handler;

        this._renderItem = reactRenderer.createItem('ActionButton', () => {
            const guard = <K extends keyof ActionButtonEventHandler>(
                anchor: Element,
                name: K,
            ): ActionButtonEventHandler[K] => {
                return (event: any) => {
                    if (this._actionButtonList.get(anchor)?.open) {
                        this._eventHandler[name](event);
                    }
                };
            };

            return (
                <>
                    {Array.from(this._actionButtonList.values()).map(
                        ({anchor, open, id, props}) => (
                            <ActionButton
                                key={id}
                                anchor={anchor}
                                open={open}
                                props={props}
                                handler={{
                                    handleActionButtonClick: guard(
                                        anchor,
                                        'handleActionButtonClick',
                                    ),
                                    handleActionButtonMouseLeave: guard(
                                        anchor,
                                        'handleActionButtonMouseLeave',
                                    ),
                                }}
                            />
                        ),
                    )}
                </>
            );
        });
    }

    show(anchor: Element, props?: ActionButtonExtraProps) {
        if (this._actionButtonList.get(anchor)?.open) return;

        if (!this._actionButtonList.has(anchor)) {
            this._actionButtonList.set(anchor, {
                anchor,
                open: true,
                id: uniqueId(),
                props,
            });
        }

        for (const item of this._actionButtonList.values()) {
            if (item.anchor === anchor) {
                item.open = true;
                continue;
            }

            item.open = false;
        }

        this._renderItem.rerender();
    }

    hide() {
        for (const item of this._actionButtonList.values()) {
            item.open = false;
        }

        this._renderItem.rerender();
    }

    clear() {
        this._actionButtonList.clear();
        this._renderItem.rerender();
    }

    destroy() {
        this._renderItem.remove();
        this._actionButtonList.clear();
    }
}

const defaultOffset: NonNullable<PopupProps['offset']> = [0, 1];
const defaultPlacement: PopupProps['placement'] = 'left-start';

function ActionButton({open, anchor, handler, props}: RenderProps) {
    const [offsetTop, offsetRight] = props?.offset ?? defaultOffset;

    return (
        <Popup
            placement={defaultPlacement}
            {...props}
            offset={[offsetTop, 0]}
            open={open}
            anchorRef={{current: anchor}}
            contentClassName="pm-action-button-popup"
        >
            <div
                style={offsetRight > 0 ? {paddingRight: offsetRight, cursor: 'text'} : undefined}
                onMouseLeave={handler.handleActionButtonMouseLeave}
            >
                <ActionButtonButton
                    className="pm-dnd-popup-btn"
                    onClick={handler.handleActionButtonClick}
                    extraProps={{}}
                />
            </div>
        </Popup>
    );
}

import type {RefObject} from 'react';

import type {HotkeyProps} from '@gravity-ui/uikit';
import type {EditorState} from 'prosemirror-state';

import type {ActionStorage} from '../../core';
import type {CodeEditor} from '../../markup';
import type {ToolbarBaseProps, ToolbarDataType, ToolbarIconData} from '../../toolbar';

// Items
export type ToolbarItemId = string & {};
export type ToolbarListId = string & {};

export interface ToolbarList {
    id: ToolbarListId;
    items: ToolbarItemId[];
}

export type ToolbarItemView<T extends ToolbarDataType = ToolbarDataType.SingleButton> = {
    className?: string;
    hint?: string | (() => string);
    hotkey?: HotkeyProps['value'];
    type?: ToolbarDataType;
    doNotActivateList?: boolean;
} & (T extends ToolbarDataType.SingleButton
    ? {
          icon: ToolbarIconData;
          title: string | (() => string);
      }
    : T extends ToolbarDataType.ListButton
      ? {
            withArrow?: boolean;
            icon: ToolbarIconData;
            title: string | (() => string);
        }
      : {});

export interface EditorActions<E> {
    exec(editor: E): void;
    isActive(editor: E): boolean;
    isEnable(editor: E): boolean;
}

type ToolbarItemEditor<T, E> = Partial<EditorActions<E>> & {
    hintWhenDisabled?: boolean | string | (() => string);
    condition?: ((state: EditorState) => void) | 'enabled';
} & (T extends ToolbarDataType.ButtonPopup
        ? {
              renderPopup: (
                  props: ToolbarBaseProps<E> & {
                      hide: () => void;
                      anchorRef: RefObject<HTMLElement>;
                  },
              ) => React.ReactNode;
          }
        : T extends ToolbarDataType.ReactComponent
          ? {
                width: number;
                component: React.ComponentType<ToolbarBaseProps<E>>;
            }
          : {});

export type ToolbarItemWysiwyg<T extends ToolbarDataType = ToolbarDataType.SingleButton> =
    ToolbarItemEditor<T, ActionStorage>;
export type ToolbarItemMarkup<T extends ToolbarDataType = ToolbarDataType.SingleButton> =
    ToolbarItemEditor<T, CodeEditor>;

export type ToolbarItem<T extends ToolbarDataType> = {
    view: ToolbarItemView<T>;
    wysiwyg?: ToolbarItemWysiwyg<T>;
    markup?: ToolbarItemMarkup<T>;
};
export type ToolbarsItems = Record<ToolbarItemId, ToolbarItem<ToolbarDataType>>;

// Orders
export type ToolbarId = string;
export type ToolbarOrders = (ToolbarList | ToolbarItemId)[][];
export type ToolbarsOrders = Record<ToolbarId, ToolbarOrders>;

export interface ToolbarsPreset {
    items: ToolbarsItems;
    orders: ToolbarsOrders;
}

export type EditorPreset = 'zero' | 'commonmark' | 'default' | 'yfm' | 'full';

import {RefObject} from 'react';

import {HotkeyProps} from '@gravity-ui/uikit';
import {EditorState} from 'prosemirror-state';

import {ActionStorage} from '../../core';
import {CodeEditor} from '../../markup';
import {ToolbarBaseProps, ToolbarDataType, ToolbarIconData} from '../../toolbar';

// Items
export type ToolbarItemId = string;
export type ToolbarListId = string;
export type ToolbarList = Record<ToolbarListId, ToolbarItemId[]>;

export type ToolbarItemCommon<T extends ToolbarDataType = ToolbarDataType.SingleButton> = {
    className?: string;
    hint?: string | (() => string);
    hotkey?: HotkeyProps['value'];
    icon?: ToolbarIconData;
    title?: string | (() => string);
    type?: ToolbarDataType;
    doNotActivateList?: boolean;
} & (T extends ToolbarDataType.ListButton
    ? {
          withArrow?: boolean;
      }
    : {});

export interface EditorCommand<E> {
    exec(editor: E): void;
    isActive(editor: E): boolean;
    isEnable(editor: E): boolean;
}

type ToolbarItem<T, E> = Partial<EditorCommand<E>> & {
    hintWhenDisabled?: boolean | string | (() => string);
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
                condition?: ((state: EditorState) => void) | 'enabled';
            }
          : {});

export type ToolbarItemWysiwyg<T extends ToolbarDataType = ToolbarDataType.SingleButton> =
    ToolbarItem<T, ActionStorage>;
export type ToolbarItemMarkup<T extends ToolbarDataType = ToolbarDataType.SingleButton> =
    ToolbarItem<T, CodeEditor>;

export type ToolbarNode<T extends ToolbarDataType = ToolbarDataType.SingleButton> = {
    common: ToolbarItemCommon;
    wysiwyg?: ToolbarItemWysiwyg<T>;
    markup?: ToolbarItemMarkup<T>;
};
export type ToolbarsNodes = Record<ToolbarItemId, ToolbarNode>;

// Orders
export type ToolbarId = string;
export type ToolbarOrders =
    | (ToolbarList | ToolbarItemId | ToolbarItemId[])[]
    | (ToolbarList | ToolbarItemId | ToolbarItemId[])[][];
export type ToolbarsOrders = Record<ToolbarId, ToolbarOrders>;

export interface ToolbarsPreset {
    nodes: ToolbarsNodes;
    orders: ToolbarsOrders;
}

export type ToolbarsPresetOrEditorPreset =
    | ToolbarsPreset
    | 'zero'
    | 'commonmark'
    | 'default'
    | 'yfm'
    | 'full';

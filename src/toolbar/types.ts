import type {HotkeyProps, IconProps} from '@gravity-ui/uikit';

import type {ClassNameProps} from '../classname';

import type {ToolbarListButtonData} from './ToolbarListButton';

export type ToolbarBaseProps<E> = ClassNameProps & {
    editor: E;
    focus(): void;
    onClick?(id: string, attrs?: {[key: string]: any}): void;
};

export type ToolbarIconData = Pick<IconProps, 'data' | 'size'>;

export type ToolbarItemData<E> = {
    id: string;
    icon: ToolbarIconData;
    title: string | (() => string);
    hint?: string | (() => string);
    hotkey?: HotkeyProps['value'];
    disabledPopoverVisible?: boolean;
    exec(editor: E): void;
    isActive(editor: E): boolean;
    isEnable(editor: E): boolean;
};

export enum ToolbarDataType {
    SingleButton = 's-button',
    ListButton = 'list-b',
    ReactNode = 'r-node',
    ReactNodeFn = 'r-node-fn',
    ReactComponent = 'r-component',
}

export type ToolbarGroupItemData<E> =
    | ToolbarSingleItemData<E>
    | ToolbarListItemData<E>
    | ToolbarReactNodeData
    | ToolbarReactNodeFnData<E>
    | ToolbarReactComponentData<E>;

export type ToolbarSingleItemData<E> = ToolbarItemData<E> & {
    id: string;
    type: ToolbarDataType.SingleButton;
    className?: string;
};

export type ToolbarListItemData<E> = ToolbarListButtonData<E> & {
    id: string;
    type: ToolbarDataType.ListButton;
    className?: string;
};

export type ToolbarReactComponentData<E> = {
    id: string;
    type: ToolbarDataType.ReactComponent;
    width: number;
    className?: string;
    component: React.ComponentType<ToolbarBaseProps<E>>;
};

export type ToolbarReactNodeData = {
    id: string;
    type: ToolbarDataType.ReactNode;
    width: number;
    content: React.ReactNode;
};

export type ToolbarReactNodeFnData<E> = {
    id: string;
    type: ToolbarDataType.ReactNodeFn;
    width: number;
    content: (e: E) => React.ReactNode;
};

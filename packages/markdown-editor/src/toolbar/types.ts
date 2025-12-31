import type {HotkeyProps, IconProps, QAProps} from '@gravity-ui/uikit';

import type {ClassNameProps} from '../classname';

export type ToolbarBaseProps<E> = ClassNameProps &
    QAProps & {
        editor: E;
        focus(): void;
        onClick?(id: string, attrs?: {[key: string]: any}): void;
        display?: ToolbarDisplay;
        disableTooltip?: boolean;
        disablePreview?: boolean;
        disableHotkey?: boolean;
    };

export type ToolbarIconData = Pick<IconProps, 'data' | 'size'>;
export type ToolbarGroupData<E> = Array<ToolbarGroupItemData<E>>;
export type ToolbarData<E> = ToolbarGroupData<E>[];
export type ToolbarDisplay = 'shrink' | 'scroll';

export type ToolbarItemData<E> = QAProps & {
    id: string;
    icon: ToolbarIconData;
    title: string | (() => string);
    hint?: string | (() => string);
    hotkey?: HotkeyProps['value'];
    preview?: React.ReactNode;
    /**
     * Alternative IDs that can be used to find this command
     */
    aliases?: string[];
    /**
     * Show hint when _isEnable()_ returns false
     *
     * `false` – don't show hint;
     *
     * `true` – show default hint;
     *
     * `string` or `() => string` – show hint with custom message.
     * @default true
     */
    hintWhenDisabled?: boolean | string | (() => string);
    exec(editor: E): void;
    isActive(editor: E): boolean;
    isEnable(editor: E): boolean;
};

export enum ToolbarDataType {
    SingleButton = 's-button',
    ListButton = 'list-b',
    ButtonPopup = 'b-popup',
    /** @deprecated Use ReactComponent type instead */
    ReactNode = 'r-node',
    /** @deprecated Use ReactComponent type instead */
    ReactNodeFn = 'r-node-fn',
    ReactComponent = 'r-component',
}

export type ToolbarGroupItemData<E> =
    | ToolbarSingleItemData<E>
    | ToolbarButtonPopupData<E>
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
    props?: object;
};

export type ToolbarButtonPopupData<E> = ToolbarItemData<E> & {
    /** not used, may be an empty function */
    exec: ToolbarItemData<E>['exec'];
    type: ToolbarDataType.ButtonPopup;
    renderPopup: (
        props: ToolbarBaseProps<E> & {hide: () => void; anchorElement: HTMLElement | null},
    ) => React.ReactNode;
    className?: string;
};

export type ToolbarListButtonItemData<E> = ToolbarItemData<E> & {
    doNotActivateList?: boolean;
};

export type ToolbarListButtonData<E> = {
    icon: ToolbarIconData;
    title: string | (() => string);
    withArrow?: boolean;
    data: ToolbarListButtonItemData<E>[];
    alwaysActive?: boolean;
    hideDisabled?: boolean;
    /** When state changes to active, replace default icon with icon of first active item */
    replaceActiveIcon?: boolean;
};

/**
 * @deprecated Use ReactComponent type instead
 */
export type ToolbarReactNodeData = {
    id: string;
    type: ToolbarDataType.ReactNode;
    width: number;
    content: React.ReactNode;
};

/**
 * @deprecated Use ReactComponent type instead
 */
export type ToolbarReactNodeFnData<E> = {
    id: string;
    type: ToolbarDataType.ReactNodeFn;
    width: number;
    content: (e: E) => React.ReactNode;
};

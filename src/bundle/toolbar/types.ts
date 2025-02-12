import type {ActionStorage} from '../../core';
import type {CodeEditor} from '../../markup';
import type {ToolbarListButtonData} from '../../toolbar';
import type {
    ToolbarBaseProps,
    ToolbarButtonPopupData,
    ToolbarData,
    ToolbarGroupData,
    ToolbarGroupItemData,
    ToolbarItemData,
    ToolbarListButtonItemData,
    ToolbarListItemData,
    ToolbarReactComponentData,
    ToolbarSingleItemData,
} from '../../toolbar/types';

export * from '../../toolbar/types';

export type WToolbarBaseProps = ToolbarBaseProps<ActionStorage>;
export type WToolbarData = ToolbarData<ActionStorage>;
export type WToolbarItemData = ToolbarItemData<ActionStorage>;
export type WToolbarSingleItemData = ToolbarSingleItemData<ActionStorage>;
export type WToolbarGroupData = ToolbarGroupData<ActionStorage>;
export type WToolbarGroupItemData = ToolbarGroupItemData<ActionStorage>;
export type WToolbarListButtonData = ToolbarListButtonData<ActionStorage>;
export type WToolbarListItemData = ToolbarListItemData<ActionStorage>;
export type WToolbarListButtonItemData = ToolbarListButtonItemData<ActionStorage>;

export type MToolbarBaseProps = ToolbarBaseProps<CodeEditor>;
export type MToolbarData = ToolbarData<CodeEditor>;
export type MToolbarItemData = ToolbarItemData<CodeEditor>;
export type MToolbarSingleItemData = ToolbarSingleItemData<CodeEditor>;
export type MToolbarGroupData = ToolbarGroupData<CodeEditor>;
export type MToolbarReactComponentData = ToolbarReactComponentData<CodeEditor>;
export type MToolbarListButtonData = ToolbarListButtonData<CodeEditor>;
export type MToolbarListItemData = ToolbarListItemData<CodeEditor>;
export type MToolbarButtonPopupData = ToolbarButtonPopupData<CodeEditor>;

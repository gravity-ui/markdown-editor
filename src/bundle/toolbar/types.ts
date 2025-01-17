import type {ActionStorage} from 'src/core';
import type {ToolbarListButtonData} from 'src/toolbar';

import type {
    ToolbarData,
    ToolbarGroupData,
    ToolbarGroupItemData,
    ToolbarItemData,
    ToolbarListButtonItemData,
    ToolbarListItemData,
    ToolbarSingleItemData,
} from '../../toolbar/types';

export * from '../../toolbar/types';

export type WToolbarData = ToolbarData<ActionStorage>;
export type WToolbarItemData = ToolbarItemData<ActionStorage>;
export type WToolbarSingleItemData = ToolbarSingleItemData<ActionStorage>;
export type WToolbarGroupData = ToolbarGroupData<ActionStorage>;
export type WToolbarGroupItemData = ToolbarGroupItemData<ActionStorage>;
export type WToolbarListButtonData = ToolbarListButtonData<ActionStorage>;
export type WToolbarListItemData = ToolbarListItemData<ActionStorage>;
export type WToolbarListButtonItemData = ToolbarListButtonItemData<ActionStorage>;

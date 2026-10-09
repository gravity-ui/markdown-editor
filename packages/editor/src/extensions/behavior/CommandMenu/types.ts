import type {ActionStorage} from '../../../core';
import type {ToolbarItemData} from '../../../toolbar';

export type CommandAction = ToolbarItemData<ActionStorage>;
export type Config = CommandAction[];

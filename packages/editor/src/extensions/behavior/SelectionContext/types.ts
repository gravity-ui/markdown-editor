import type {ActionStorage} from '#core';
import type {EditorState} from '#pm/state';
import type {
    ToolbarButtonPopupData,
    ToolbarGroupItemData,
    ToolbarSingleItemData,
} from 'src/toolbar';

export type ContextGroupItemData =
    | (ToolbarGroupItemData<ActionStorage> & {
          condition?: (state: EditorState) => void;
      })
    | ((ToolbarSingleItemData<ActionStorage> | ToolbarButtonPopupData<ActionStorage>) & {
          condition?: 'enabled';
      });

export type ContextGroupData = ContextGroupItemData[];
export type ContextConfig = ContextGroupData[];

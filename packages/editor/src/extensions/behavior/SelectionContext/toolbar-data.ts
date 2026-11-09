import type {EditorState} from 'prosemirror-state';

import type {ActionStorage} from '../../../core';
import {isFunction} from '../../../lodash';
import type {ToolbarData} from '../../../toolbar';

import type {ContextConfig} from './types';

const KEY_SEP = '|||';

export function getToolbarData(
    config: ContextConfig,
    editor: ActionStorage,
    state: EditorState,
): ToolbarData<ActionStorage> {
    const conditionKey = config
        .flatMap((groupData) =>
            groupData.map((item) => {
                const {condition} = item;
                if (condition === 'enabled') return item.isEnable(editor);
                if (isFunction(condition)) return condition(state);
                return true;
            }),
        )
        .join(KEY_SEP);

    const results = conditionKey.split(KEY_SEP);
    let idx = 0;
    return config
        .map((groupData) => groupData.filter(() => results[idx++] === 'true'))
        .filter((groupData) => Boolean(groupData.length));
}

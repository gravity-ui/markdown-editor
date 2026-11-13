import type {EditorState} from 'prosemirror-state';

import type {ActionStorage} from '../../../core';
import {isFunction} from '../../../lodash';
import type {ToolbarData} from '../../../toolbar';

import type {ContextConfig} from './types';

export function createToolbarDataResolver() {
    let previousConfig: ContextConfig | undefined;
    let previousResults: (boolean | void)[] = [];
    let toolbarData: ToolbarData<ActionStorage> = [];

    return (
        config: ContextConfig,
        editor: ActionStorage,
        state: EditorState,
    ): ToolbarData<ActionStorage> => {
        const results = config.flatMap((groupData) =>
            groupData.map((item) => {
                const {condition} = item;
                if (condition === 'enabled') return item.isEnable(editor);
                if (isFunction(condition)) return condition(state);
                return true;
            }),
        );

        if (
            config === previousConfig &&
            results.length === previousResults.length &&
            results.every((result, index) => result === previousResults[index])
        ) {
            return toolbarData;
        }

        let idx = 0;
        toolbarData = config
            .map((groupData) => groupData.filter(() => results[idx++] === true))
            .filter((groupData) => Boolean(groupData.length));
        previousConfig = config;
        previousResults = results;
        return toolbarData;
    };
}

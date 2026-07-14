import type {ActionSpec, ExtensionDeps} from '../../../core';

import {liftSelectedListItems, sinkSelectedListItems, toList} from './commands';
import {ListNode} from './const';
import {blType, isIntoListOfType, liType, olType} from './utils';

export const actions = {
    toBulletList: ({schema}: ExtensionDeps): ActionSpec => {
        const toBulletList = toList(blType(schema));
        return {
            isActive: isIntoListOfType(ListNode.BulletList),
            isEnable: toBulletList,
            run: toBulletList,
        };
    },

    toOrderedList: ({schema}: ExtensionDeps): ActionSpec => {
        const toOrderedList = toList(olType(schema));
        return {
            isActive: isIntoListOfType(ListNode.OrderedList),
            isEnable: toOrderedList,
            run: toOrderedList,
        };
    },

    liftListItem: ({schema}: ExtensionDeps): ActionSpec => {
        return {
            isEnable: liftSelectedListItems(liType(schema)),
            run: liftSelectedListItems(liType(schema)),
        };
    },

    sinkListItem: ({schema}: ExtensionDeps): ActionSpec => {
        return {
            isEnable: sinkSelectedListItems(liType(schema)),
            run: sinkSelectedListItems(liType(schema)),
        };
    },
};

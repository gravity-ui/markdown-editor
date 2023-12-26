import {liftListItem, sinkListItem} from 'prosemirror-schema-list';

import type {ActionSpec, ExtensionDeps} from '../../../core';

import {toList} from './commands';
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
            isEnable: liftListItem(liType(schema)),
            run: liftListItem(liType(schema)),
        };
    },

    sinkListItem: ({schema}: ExtensionDeps): ActionSpec => {
        return {
            isEnable: sinkListItem(liType(schema)),
            run: sinkListItem(liType(schema)),
        };
    },
};

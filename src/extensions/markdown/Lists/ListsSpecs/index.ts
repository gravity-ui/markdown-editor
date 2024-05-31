import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {ListNode} from './const';
import {fromYfm} from './fromYfm';
import {spec} from './spec';
import {toYfm} from './toYfm';

export {ListNode} from './const';
export const liType = nodeTypeFactory(ListNode.ListItem);
export const blType = nodeTypeFactory(ListNode.BulletList);
export const olType = nodeTypeFactory(ListNode.OrderedList);

export const ListsSpecs: ExtensionAuto = (builder) => {
    builder
        .addNode(ListNode.ListItem, () => ({
            spec: spec[ListNode.ListItem],
            toMd: toYfm[ListNode.ListItem],
            fromMd: {tokenSpec: fromYfm[ListNode.ListItem]},
        }))
        .addNode(ListNode.BulletList, () => ({
            spec: spec[ListNode.BulletList],
            toMd: toYfm[ListNode.BulletList],
            fromMd: {tokenSpec: fromYfm[ListNode.BulletList]},
        }))
        .addNode(ListNode.OrderedList, () => ({
            spec: spec[ListNode.OrderedList],
            toMd: toYfm[ListNode.OrderedList],
            fromMd: {tokenSpec: fromYfm[ListNode.OrderedList]},
        }));
};

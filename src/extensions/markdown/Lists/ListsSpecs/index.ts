import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';
import {ListNode} from './const';
import {fromYfm} from './fromYfm';
import {toYfm} from './toYfm';
import {spec} from './spec';

export {ListNode} from './const';
export const liType = nodeTypeFactory(ListNode.ListItem);
export const blType = nodeTypeFactory(ListNode.BulletList);
export const olType = nodeTypeFactory(ListNode.OrderedList);

export const ListsSpecs: ExtensionAuto = (builder) => {
    builder
        .addNode(ListNode.ListItem, () => ({
            spec: spec[ListNode.ListItem],
            toYfm: toYfm[ListNode.ListItem],
            fromYfm: {tokenSpec: fromYfm[ListNode.ListItem]},
        }))
        .addNode(ListNode.BulletList, () => ({
            spec: spec[ListNode.BulletList],
            toYfm: toYfm[ListNode.BulletList],
            fromYfm: {tokenSpec: fromYfm[ListNode.BulletList]},
        }))
        .addNode(ListNode.OrderedList, () => ({
            spec: spec[ListNode.OrderedList],
            toYfm: toYfm[ListNode.OrderedList],
            fromYfm: {tokenSpec: fromYfm[ListNode.OrderedList]},
        }));
};

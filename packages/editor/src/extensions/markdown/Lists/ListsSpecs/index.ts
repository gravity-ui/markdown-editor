import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {ListNode} from './const';
import {parserTokens} from './parser';
import {schemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {ListsAttr, ListNode} from './const';
export const liType = nodeTypeFactory(ListNode.ListItem);
export const blType = nodeTypeFactory(ListNode.BulletList);
export const olType = nodeTypeFactory(ListNode.OrderedList);

export const ListsSpecs: ExtensionAuto = (builder) => {
    builder
        .addNode(ListNode.ListItem, () => ({
            spec: schemaSpecs[ListNode.ListItem],
            toMd: serializerTokens[ListNode.ListItem],
            fromMd: {tokenSpec: parserTokens[ListNode.ListItem]},
        }))
        .addNode(ListNode.BulletList, () => ({
            spec: schemaSpecs[ListNode.BulletList],
            toMd: serializerTokens[ListNode.BulletList],
            fromMd: {tokenSpec: parserTokens[ListNode.BulletList]},
        }))
        .addNode(ListNode.OrderedList, () => ({
            spec: schemaSpecs[ListNode.OrderedList],
            toMd: serializerTokens[ListNode.OrderedList],
            fromMd: {tokenSpec: parserTokens[ListNode.OrderedList]},
        }));
};

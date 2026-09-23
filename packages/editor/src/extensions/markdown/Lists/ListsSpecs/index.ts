import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

import {ListNode} from './const';
import {ListsParserSpecs} from './parser';
import {ListsSchemaSpecs} from './schema';
import {ListsSerializerSpecs} from './serializer';

export {ListsAttr, ListNode} from './const';
export const liType = nodeTypeFactory(ListNode.ListItem);
export const blType = nodeTypeFactory(ListNode.BulletList);
export const olType = nodeTypeFactory(ListNode.OrderedList);

export const ListsSpecs: ExtensionAuto = (builder) => {
    builder.use(ListsSchemaSpecs).use(ListsParserSpecs).use(ListsSerializerSpecs);
};

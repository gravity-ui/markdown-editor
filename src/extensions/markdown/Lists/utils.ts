import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {findParentNodeOfType} from 'prosemirror-utils';
import {nodeTypeFactory} from '../../../utils/schema';
import {ListNode} from './const';

export const liType = nodeTypeFactory(ListNode.ListItem);
export const blType = nodeTypeFactory(ListNode.BulletList);
export const olType = nodeTypeFactory(ListNode.OrderedList);

export const findAnyParentList = (schema: Schema) =>
    findParentNodeOfType([blType(schema), olType(schema)]);

export const isIntoListOfType = (nodeName: ListNode) => (state: EditorState) =>
    findAnyParentList(state.schema)(state.selection)?.node.type.name === nodeName;

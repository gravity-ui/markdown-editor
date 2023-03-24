import type {Node, Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {findParentNodeOfType} from 'prosemirror-utils';
import {blType, olType, ListNode, liType} from './ListsSpecs';

export {liType, blType, olType} from './ListsSpecs';

export const findAnyParentList = (schema: Schema) =>
    findParentNodeOfType([blType(schema), olType(schema)]);

export const isIntoListOfType = (nodeName: ListNode) => (state: EditorState) =>
    findAnyParentList(state.schema)(state.selection)?.node.type.name === nodeName;

export const isListNode = ({type}: Node): boolean =>
    type === blType(type.schema) || type === olType(type.schema);

export const isListItemNode = (node: Node): boolean => node.type === liType(node.type.schema);

export const isListOrItemNode = (node: Node): boolean => isListNode(node) || isListItemNode(node);

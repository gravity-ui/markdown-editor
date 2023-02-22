import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {findParentNodeOfType} from 'prosemirror-utils';
import {blType, olType, ListNode} from './ListsSpecs';

export {liType, blType, olType} from './ListsSpecs';

export const findAnyParentList = (schema: Schema) =>
    findParentNodeOfType([blType(schema), olType(schema)]);

export const isIntoListOfType = (nodeName: ListNode) => (state: EditorState) =>
    findAnyParentList(state.schema)(state.selection)?.node.type.name === nodeName;

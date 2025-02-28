import type {Node, Schema} from 'prosemirror-model';
import type {EditorState} from 'prosemirror-state';
import {
    findChildren,
    findChildrenByType,
    findParentNodeOfType,
    hasParentNodeOfType,
    // @ts-ignore // TODO: fix cjs build
} from 'prosemirror-utils';

import {TableNode} from './const';

export const isIntoTable = (state: EditorState) =>
    hasParentNodeOfType(state.schema.nodes[TableNode.Table])(state.selection);

export const findParentTable = (state: EditorState) =>
    findParentNodeOfType(state.schema.nodes[TableNode.Table])(state.selection);

export const findParentBody = (state: EditorState) =>
    findParentNodeOfType(state.schema.nodes[TableNode.Body])(state.selection);

export const findParentRow = (state: EditorState) =>
    findParentNodeOfType(state.schema.nodes[TableNode.Row])(state.selection);

export const findParentCell = (state: EditorState) =>
    findParentNodeOfType([
        state.schema.nodes[TableNode.HeaderCell],
        state.schema.nodes[TableNode.DataCell],
    ])(state.selection);

export const findTableRows = (table: Node, schema: Schema) =>
    findChildrenByType(table, schema.nodes[TableNode.Row]);

export const findTableCells = (table: Node, schema: Schema) =>
    findChildren(table, (node: Node) =>
        [schema.nodes[TableNode.HeaderCell].name, schema.nodes[TableNode.DataCell].name].includes(
            node.type.name,
        ),
    );

import type {Node, ResolvedPos, Schema} from '#pm/model';
import type {EditorState} from '#pm/state';
import {
    findChildren,
    findChildrenByType,
    findParentNodeOfType,
    findParentNodeOfTypeClosestToPos,
    hasParentNodeOfType,
} from '#pm/utils';

import {TableNode} from './const';

export const isIntoTable = (state: EditorState) =>
    hasParentNodeOfType(state.schema.nodes[TableNode.Table])(state.selection);

export const findParentTable = (state: EditorState) =>
    findParentNodeOfType(state.schema.nodes[TableNode.Table])(state.selection);

export const findParentTableOnPosOnPos = ($pos: ResolvedPos) =>
    findParentNodeOfTypeClosestToPos($pos, $pos.doc.type.schema.nodes[TableNode.Table]);

export const findParentHeadOnPos = ($pos: ResolvedPos) =>
    findParentNodeOfTypeClosestToPos($pos, $pos.doc.type.schema.nodes[TableNode.Head]);

export const findParentBody = (state: EditorState) =>
    findParentNodeOfType(state.schema.nodes[TableNode.Body])(state.selection);

export const findParentBodyOnPos = ($pos: ResolvedPos) =>
    findParentNodeOfTypeClosestToPos($pos, $pos.doc.type.schema.nodes[TableNode.Body]);

export const findParentRow = (state: EditorState) =>
    findParentNodeOfType(state.schema.nodes[TableNode.Row])(state.selection);

export const findParentRowOnPos = ($pos: ResolvedPos) =>
    findParentNodeOfTypeClosestToPos($pos, $pos.doc.type.schema.nodes[TableNode.Row]);

export const findParentCell = (state: EditorState) =>
    findParentNodeOfType([
        state.schema.nodes[TableNode.HeaderCell],
        state.schema.nodes[TableNode.DataCell],
    ])(state.selection);

export const findParentCellOnPos = ($pos: ResolvedPos) =>
    findParentNodeOfTypeClosestToPos($pos, [
        $pos.doc.type.schema.nodes[TableNode.HeaderCell],
        $pos.doc.type.schema.nodes[TableNode.DataCell],
    ]);

export const findTableRows = (table: Node, schema: Schema) =>
    findChildrenByType(table, schema.nodes[TableNode.Row]);

export const findTableCells = (table: Node, schema: Schema) =>
    findChildren(table, (node: Node) =>
        [schema.nodes[TableNode.HeaderCell].name, schema.nodes[TableNode.DataCell].name].includes(
            node.type.name,
        ),
    );

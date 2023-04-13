import type {ExtensionAuto} from '../../../../core';
import {fromYfm} from './fromYfm';
import {toYfm} from './toYfm';
import {spec} from './spec';
import {TableNode} from './const';

export {TableNode} from './const';

export const TableSpecs: ExtensionAuto = (builder) => {
    builder
        .addNode(TableNode.Table, () => ({
            spec: spec[TableNode.Table],
            toYfm: toYfm[TableNode.Table],
            fromYfm: {tokenSpec: fromYfm[TableNode.Table]},
        }))
        .addNode(TableNode.Head, () => ({
            spec: spec[TableNode.Head],
            toYfm: toYfm[TableNode.Head],
            fromYfm: {tokenSpec: fromYfm[TableNode.Head]},
        }))
        .addNode(TableNode.Body, () => ({
            spec: spec[TableNode.Body],
            toYfm: toYfm[TableNode.Body],
            fromYfm: {tokenSpec: fromYfm[TableNode.Body]},
        }))
        .addNode(TableNode.Row, () => ({
            spec: spec[TableNode.Row],
            toYfm: toYfm[TableNode.Row],
            fromYfm: {tokenSpec: fromYfm[TableNode.Row]},
        }))
        .addNode(TableNode.HeaderCell, () => ({
            spec: spec[TableNode.HeaderCell],
            toYfm: toYfm[TableNode.HeaderCell],
            fromYfm: {tokenSpec: fromYfm[TableNode.HeaderCell]},
        }))
        .addNode(TableNode.DataCell, () => ({
            spec: spec[TableNode.DataCell],
            toYfm: toYfm[TableNode.DataCell],
            fromYfm: {tokenSpec: fromYfm[TableNode.DataCell]},
        }));
};

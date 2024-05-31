import type {ExtensionAuto} from '../../../../core';

import {TableNode} from './const';
import {fromYfm} from './fromYfm';
import {spec} from './spec';
import {toYfm} from './toYfm';

export {TableNode} from './const';

export const TableSpecs: ExtensionAuto = (builder) => {
    builder
        .addNode(TableNode.Table, () => ({
            spec: spec[TableNode.Table],
            toMd: toYfm[TableNode.Table],
            fromMd: {tokenSpec: fromYfm[TableNode.Table]},
        }))
        .addNode(TableNode.Head, () => ({
            spec: spec[TableNode.Head],
            toMd: toYfm[TableNode.Head],
            fromMd: {tokenSpec: fromYfm[TableNode.Head]},
        }))
        .addNode(TableNode.Body, () => ({
            spec: spec[TableNode.Body],
            toMd: toYfm[TableNode.Body],
            fromMd: {tokenSpec: fromYfm[TableNode.Body]},
        }))
        .addNode(TableNode.Row, () => ({
            spec: spec[TableNode.Row],
            toMd: toYfm[TableNode.Row],
            fromMd: {tokenSpec: fromYfm[TableNode.Row]},
        }))
        .addNode(TableNode.HeaderCell, () => ({
            spec: spec[TableNode.HeaderCell],
            toMd: toYfm[TableNode.HeaderCell],
            fromMd: {tokenSpec: fromYfm[TableNode.HeaderCell]},
        }))
        .addNode(TableNode.DataCell, () => ({
            spec: spec[TableNode.DataCell],
            toMd: toYfm[TableNode.DataCell],
            fromMd: {tokenSpec: fromYfm[TableNode.DataCell]},
        }));
};

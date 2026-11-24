import type {Node} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';

import {ExtensionsManager} from '../src/core';
import {BaseSchemaSpecs} from '../src/extensions/base/specs';
import {YfmTableSpecs} from '../src/extensions/yfm/YfmTable/YfmTableSpecs';
import {TableDesc} from '../src/table-utils/table-desc';

const {markupParser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {}),
}).buildDeps();

export function createTableState(markup: string): EditorState {
    return EditorState.create({doc: markupParser.parse(markup)});
}

export function getTableDesc(table: Node): TableDesc {
    const desc = TableDesc.create(table);
    if (!desc) throw new Error('Expected a valid table');
    return desc;
}

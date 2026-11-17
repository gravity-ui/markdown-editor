import {EditorState, Selection, TextSelection} from 'prosemirror-state';
import {expect, it} from 'vitest';

import {ExtensionsManager} from 'src/core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {TableDesc} from 'src/table-utils/table-desc';

import {applyCommand} from '../../../../../../../tests/utils';
import {YfmTableSpecs} from '../../../YfmTableSpecs';
import {YfmTableAttr} from '../../../YfmTableSpecs/const';

import {insertEmptyColumn} from './insert-empty-column';

const {markupParser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {}),
}).buildDeps();

it.each([
    {name: 'a table with a cell in each row', secondRow: 'Beta | >'},
    {name: 'a table with a fully covered row', secondRow: '^ | ^'},
])('should extend colspans without moving the selection in $name', ({secondRow}) => {
    const doc = markupParser.parse(`#|\n|| Alpha | > ||\n|| ${secondRow} ||\n|#`);
    const from = Selection.atStart(doc).from + 1;
    const selection = TextSelection.create(doc, from, from + 2);
    const state = EditorState.create({doc, selection});

    const {res, tr} = applyCommand(state, insertEmptyColumn({tablePos: 0, colIndex: 1}));

    expect(res).toBe(true);
    expect(tr.selection.eq(selection)).toBe(true);
    const table = tr.doc.child(0);
    expect(table.child(0).child(0).child(0).attrs[YfmTableAttr.Colspan]).toBe(3);
    expect(TableDesc.create(table)).toMatchObject({rows: 2, cols: 3});
});

import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {applyCommand} from '../../../tests/utils';
import {ExtensionsManager} from '../../core';
import {BaseSchemaSpecs} from '../../extensions/base/specs';
import {TableSpecs} from '../../extensions/markdown/Table/TableSpecs';
import {YfmTableSpecs} from '../../extensions/yfm/YfmTable/YfmTableSpecs';

import {addColumnAfter} from './addColumnAfter';
import {removeCurrentColumn} from './removeCurrentColumn';

const {markupParser} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(TableSpecs).use(YfmTableSpecs, {}),
}).buildDeps();

describe.each([
    {
        name: 'addColumnAfter',
        command: addColumnAfter,
        expected: '| A | B | |\n| --- | --- | --- |\n| C | D | |',
    },
    {
        name: 'removeCurrentColumn',
        command: removeCurrentColumn,
        expected: '| A |\n| --- |\n| C |',
    },
])('$name', ({command, expected}) => {
    it('should reject a missing target cell before dispatch', () => {
        const state = createState('#|\n|| A | B ||\n|| ^ | ^ ||\n|#');

        expect(command(state)).toBe(false);
        expect(applyCommand(state, command)).toStrictEqual({res: false, tr: undefined});
    });

    it('should edit a column when every row has a target cell', () => {
        const state = createState('| A | B |\n| --- | --- |\n| C | D |');

        expect(command(state)).toBe(true);
        const {res, tr} = applyCommand(state, command);
        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(markupParser.parse(expected));
    });
});

function createState(markup: string) {
    const doc = markupParser.parse(markup);
    let cellPos = -1;
    doc.descendants((node, pos) => {
        if (node.text === 'B') cellPos = pos;
    });
    return EditorState.create({doc, selection: TextSelection.create(doc, cellPos)});
}

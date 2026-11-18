import {DOMParser, type Node} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from 'src/core';

import {applyCommand} from '../../../../../tests/utils';
import {BaseSchemaSpecs} from '../../../base/specs';
import {YfmTableSpecs} from '../YfmTableSpecs';

import {goToNextRow} from './goToNextRow';

const {markupParser, schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {}),
}).buildDeps();

let view: EditorView;

afterEach(() => {
    view?.destroy();
    vi.restoreAllMocks();
});

describe.each([
    {name: 'ordinary rows', rows: '|| A | B ||\n|| C | D ||'},
    {name: 'a preceding rowspan', rows: '|| A | B ||\n|| ^ | D ||'},
    {name: 'a fully covered row', rows: '|| A | B ||\n|| ^ | ^ ||\n|| ^ | D ||'},
    {name: 'the current rowspan', rows: '|| A | B ||\n|| C | ^ ||\n|| E | D ||'},
    {name: 'a preceding colspan', rows: '|| A | > | B ||\n|| C | E | D ||'},
    {name: 'a nested table in another cell', rows: '||\n\n#|\n|| X ||\n|#\n\n| B ||\n|| C | D ||'},
    {name: 'a nested current table', rows: '||\n\n#|\n|| A | B ||\n|| ^ | D ||\n|#\n\n||'},
])('$name', ({rows}) => {
    it.each([
        {dir: 'up', source: 'D', target: 'B'},
        {dir: 'down', source: 'B', target: 'D'},
    ] as const)('should move $dir in the same logical column', ({dir, source, target}) => {
        const doc = markupParser.parse(`#|\n${rows}\n|#`);
        createView(doc, source);

        const {res, tr} = move(dir);

        expect(res).toBe(true);
        expect(tr.selection.from).toBe(textPos(doc, target));
        expect(tr.doc).toBe(doc);
    });
});

it.each([
    {dir: 'down', source: 'B', target: 'C'},
    {dir: 'up', source: 'F', target: 'C'},
    {dir: 'down', source: 'C', target: 'E'},
    {dir: 'up', source: 'C', target: 'A'},
] as const)('should move $dir from $source to $target with a colspan', ({dir, source, target}) => {
    const doc = markupParser.parse('#|\n|| A | B ||\n|| C | > ||\n|| ^ | ^ ||\n|| E | F ||\n|#');
    createView(doc, source);

    const {res, tr} = move(dir);

    expect(res).toBe(true);
    expect(tr.selection.from).toBe(textPos(doc, target));
    expect(tr.doc).toBe(doc);
});

it('should locate the current cell between shared rows and cells', () => {
    const parsed = markupParser.parse('#|\n|| A ||\n|#');
    const table = parsed.child(0);
    const body = table.child(0);
    const cell = body.child(0).child(0);
    const row = body.child(0).type.create(null, [cell, cell]);
    const doc = parsed.type.create(
        null,
        table.type.create(null, body.type.create(null, [row, row, row])),
    );
    createView(doc, 22);

    const {res, tr} = move('down');

    expect(res).toBe(true);
    expect(tr.selection.from).toBe(34);
    expect(tr.doc).toBe(doc);
});

it.each([
    {dir: 'down', source: 'B', target: 'D'},
    {dir: 'up', source: 'D', target: 'B'},
] as const)('should skip empty rows $dir in a nested table', ({dir, source, target}) => {
    const doc = parseHTML(`<table><tr><td><table>
        <tr><td>A</td><td>B</td></tr>
        <tr></tr><tr></tr>
        <tr><td>C</td><td>D</td></tr>
    </table></td></tr><tr><td>E</td></tr></table>`);
    createView(doc, source);

    const {res, tr} = move(dir);

    expect(res).toBe(true);
    expect(tr.selection.from).toBe(textPos(doc, target));
    expect(tr.doc).toBe(doc);
});

it('should keep native movement when the next nonempty row has no matching cell', () => {
    const doc = parseHTML(`<table>
        <tr><td>A</td><td>B</td></tr><tr></tr><tr><td>C</td></tr>
    </table>`);
    createView(doc, 'B');

    expect(move('down')).toStrictEqual({res: false, tr: undefined});
});

it('should keep native movement inside a textblock', () => {
    createView(markupParser.parse('#|\n|| A ||\n|| B ||\n|#'), 'A');
    vi.mocked(view.endOfTextblock).mockReturnValue(false);

    expect(move('down')).toStrictEqual({res: false, tr: undefined});
});

it('should keep native movement in a ragged table without empty rows', () => {
    createView(parseHTML('<table><tr><td>A</td><td>B</td></tr><tr><td>C</td></tr></table>'), 'A');

    expect(move('down')).toStrictEqual({res: false, tr: undefined});
});

it.each([
    {dir: 'up', emptyRows: false},
    {dir: 'down', emptyRows: false},
    {dir: 'up', emptyRows: true},
    {dir: 'down', emptyRows: true},
] as const)('should move $dir outside the table with emptyRows=$emptyRows', ({dir, emptyRows}) => {
    const doc = emptyRows
        ? parseHTML('<table><tr><td>A</td></tr><tr></tr><tr><td>B</td></tr></table>')
        : markupParser.parse('#|\n|| A ||\n|#');
    createView(doc, emptyRows && dir === 'down' ? 'B' : 'A');

    expectGapCursor(dir, dir === 'up' ? 0 : doc.content.size);
});

it.each([
    {dir: 'up', source: 'B'},
    {dir: 'down', source: 'C'},
] as const)('should move $dir outside a ragged table at its edge', ({dir, source}) => {
    const doc = parseHTML(
        '<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td><td>E</td></tr></table>',
    );
    createView(doc, source);

    expectGapCursor(dir, dir === 'up' ? 0 : doc.content.size);
});

it('should leave a nested table after a rowspan inside its parent cell', () => {
    const doc = markupParser.parse(
        '#|\n||\n\n#|\n|| A | B ||\n|| ^ | C ||\n|#\n\n| outside ||\n|#',
    );
    createView(doc, 'A');

    expectGapCursor('down', 27);
});

function createView(doc: Node, source: string | number) {
    const state = EditorState.create({
        doc,
        selection: TextSelection.create(
            doc,
            typeof source === 'string' ? textPos(doc, source) : source,
        ),
    });
    view = new EditorView(null, {state});
    vi.spyOn(view, 'endOfTextblock').mockReturnValue(true);
}

function expectGapCursor(dir: 'up' | 'down', from: number) {
    const doc = view.state.doc;
    const {res, tr} = move(dir);

    expect(res).toBe(true);
    expect(tr.doc).toBe(doc);
    expect(tr.selection).toMatchObject({
        selectionName: 'GapCursorSelection',
        from,
        meta: {direction: dir === 'up' ? 'before' : 'after'},
    });
}

function move(dir: 'up' | 'down') {
    return applyCommand(view.state, (state, dispatch) => goToNextRow(dir)(state, dispatch, view));
}

function textPos(doc: Node, text: string) {
    let result = -1;
    doc.descendants((node, pos) => {
        if (node.text === text) result = pos;
    });
    return result;
}

function parseHTML(html: string) {
    const element = document.createElement('div');
    element.innerHTML = html;
    return DOMParser.fromSchema(schema).parse(element);
}

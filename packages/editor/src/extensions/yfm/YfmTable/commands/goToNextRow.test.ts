import type {Node} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {applyCommand} from '../../../../../tests/utils';
import {ExtensionsManager} from '../../../../core';
import {BaseSchemaSpecs} from '../../../base/specs';
import {YfmTableSpecs} from '../YfmTableSpecs';

import {goToNextRow} from './goToNextRow';

const {markupParser} = new ExtensionsManager({
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

it('should locate the current cell between shared nodes', () => {
    const parsed = markupParser.parse('#|\n|| A ||\n|#');
    const table = parsed.child(0);
    const body = table.child(0);
    const row = body.child(0);
    const doc = parsed.type.create(
        null,
        table.type.create(null, body.type.create(null, [row, row, row])),
    );
    createView(doc, 12);

    const {res, tr} = move('down');

    expect(res).toBe(true);
    expect(tr.selection.from).toBe(19);
    expect(tr.doc).toBe(doc);
});

it('should keep native movement inside a textblock', () => {
    createView(markupParser.parse('#|\n|| A ||\n|| B ||\n|#'), 'A');
    vi.mocked(view.endOfTextblock).mockReturnValue(false);

    expect(move('down')).toStrictEqual({res: false, tr: undefined});
});

it.each(['up', 'down'] as const)('should move %s outside the table at its edge', (dir) => {
    const doc = markupParser.parse('#|\n|| A ||\n|#');
    createView(doc, 'A');

    const {res, tr} = move(dir);

    expect(res).toBe(true);
    expect(tr.doc).toBe(doc);
    expect(tr.selection).toMatchObject({
        selectionName: 'GapCursorSelection',
        from: dir === 'up' ? 0 : doc.content.size,
        meta: {direction: dir === 'up' ? 'before' : 'after'},
    });
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

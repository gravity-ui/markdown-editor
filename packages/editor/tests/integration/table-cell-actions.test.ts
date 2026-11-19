import {EditorState, type Selection, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it, vi} from 'vitest';

import {type ActionSpec, ExtensionsManager} from 'src/core';
import {showGptWidget} from 'src/extensions/additional/GPT/actions';
import {addMermaid} from 'src/extensions/additional/Mermaid/actions';
import {addYfmHtmlBlock} from 'src/extensions/additional/YfmHtmlBlock/actions';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {GapCursorSelection} from 'src/extensions/behavior/Cursor/GapCursorSelection';
import {ImageSpecs} from 'src/extensions/markdown/Image/ImageSpecs';
import {addImage} from 'src/extensions/markdown/Image/actions';
import {LinkSpecs, linkType} from 'src/extensions/markdown/Link/LinkSpecs';
import {linkCommand} from 'src/extensions/markdown/Link/actions/linkActions';
import {linkActionSpec2} from 'src/extensions/markdown/Link/actions/linkEnhanceActions';
import {Table} from 'src/extensions/markdown/Table';
import {createTableAction} from 'src/extensions/markdown/Table/actions/tableActions';
import {addImageWidget} from 'src/extensions/yfm/ImgSize/ImageWidget/actions';
import {addImage as addSizedImage} from 'src/extensions/yfm/ImgSize/actions';
import {addVideo} from 'src/extensions/yfm/Video/actions';
import {addFileWidget} from 'src/extensions/yfm/YfmFile/YfmFileWidget/actions';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {createYfmTable} from 'src/extensions/yfm/YfmTable/actions';
import {createYfmTabs} from 'src/extensions/yfm/YfmTabs/actions';
import {TableCellSelection, getTableGeometry} from 'src/table-utils/cell-selection';

const deps = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(Table)
            .use(YfmTable, {})
            .use(ImageSpecs)
            .use(LinkSpecs),
}).buildDeps();
const cursorActions: [string, ActionSpec, Record<string, unknown>?][] = [
    ['image', addImage(deps.schema), {src: 'image.png'}],
    ['sized image', addSizedImage(deps.schema), {src: 'image.png'}],
    ['image widget', addImageWidget(deps, {needToSetDimensionsForUploadedImages: false})],
    ['file widget', addFileWidget(deps)],
    ['video', addVideo, {service: 'youtube', url: 'https://www.youtube.com/watch?v=some-video'}],
    ['Mermaid', addMermaid],
    ['HTML block', addYfmHtmlBlock],
];
const actions: typeof cursorActions = [
    ...cursorActions,
    ['link', linkCommand(linkType(deps.schema), deps), {href: 'https://example.com'}],
    ['addLink', linkActionSpec2(deps)],
    ['Markdown table', createTableAction(deps)],
    ['YFM table', createYfmTable],
    ['tabs', createYfmTabs],
    ['GPT', showGptWidget(deps)],
];

describe.each([
    {name: 'Markdown', markup: '| one | two |\n| --- | --- |\n| a | b |', actions},
    {name: 'YFM', markup: '#|\n|| one | two ||\n|#', actions},
    {
        name: 'linked YFM',
        markup: '#|\n|| [one](https://example.com) | [two](https://example.com) ||\n|#',
        actions: actions.filter(([name]) => name === 'link' || name === 'addLink'),
    },
    {name: 'empty YFM', markup: '#|\n|| | ||\n|#', actions},
])('Actions with $name cell selection', ({markup, actions: cases}) => {
    it.each(cases)(
        'should disable %s and ignore direct execution',
        (_actionName, action, attrs) => {
            const doc = deps.markupParser.parse(markup);
            const geometry = getTableGeometry(doc.firstChild!)!;
            for (const head of [geometry.cellAt(0, 0)!, geometry.cellAt(0, 1)!]) {
                const selection = TableCellSelection.create(
                    doc,
                    geometry.cellAt(0, 0)!.offset,
                    head.offset,
                );
                expectInsertionDisabled(action, selection, attrs);
            }
        },
    );
});

describe('Insertion action selection compatibility', () => {
    it.each(cursorActions)(
        'should disable %s and ignore direct execution with selected text',
        (_name, action, attrs) => {
            const doc = deps.markupParser.parse('word');
            expectInsertionDisabled(action, TextSelection.create(doc, 1, 5), attrs);
        },
    );

    it('should preserve table insertion at a gap cursor', () => {
        const doc = deps.markupParser.parse('word');
        let state = EditorState.create({doc, selection: new GapCursorSelection(doc.resolve(0))});
        expect(createYfmTable.isEnable(state)).toBe(true);
        createYfmTable.run(state, (tr) => {
            state = state.apply(tr);
        });
        expect(state.doc.firstChild?.type.name).toBe('yfm_table');
        expect(state.doc.textContent).toBe('word');
        state.doc.check();
    });
});

function expectInsertionDisabled(
    action: ActionSpec,
    selection: Selection,
    attrs?: Record<string, unknown>,
) {
    const state = EditorState.create({doc: selection.$from.doc, selection});
    const view = new EditorView(null, {state});
    const dispatch = vi.spyOn(view, 'dispatch');
    try {
        expect(action.isEnable(state, undefined, view)).toBe(false);
        action.run(state, dispatch, view, attrs);
        expect(dispatch).not.toHaveBeenCalled();
    } finally {
        view.destroy();
    }
}

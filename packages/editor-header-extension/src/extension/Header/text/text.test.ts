// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {EditorState, NodeSelection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseSchemaSpecs,
    BlockquoteSpecs,
    BoldSpecs,
    HeadingSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {afterEach, describe, expect, it} from 'vitest';

import {HeaderSpecs} from '../specs';

import {
    headerTitleSizeKeymap,
    setHeaderTitleColor,
    setHeaderTitleSize,
    toggleHeaderText,
} from './commands';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(HeadingSpecs, {})
            .use(BlockquoteSpecs)
            .use(ListsSpecs)
            .use(HeaderSpecs),
}).buildDeps();

const full = [
    ':::header{height="m" width="m"}',
    '',
    ':::header-title{size="1" color="red"}',
    'Team **portal**',
    ':::',
    '',
    ':::header-content',
    'First paragraph',
    '',
    'Second paragraph',
    ':::',
    '',
    ':::',
].join('\n');

let view: EditorView | undefined;

afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup: string, editable = true) {
    const doc = markupParser.parse(markup);
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({schema, doc, plugins: [history()]}),
        editable: () => editable,
    });
    return view;
}

function select(editor: EditorView, pos: number) {
    editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos)));
}

function findHeaderNode(doc: Node) {
    let header: Node | undefined;
    doc.descendants((node) => {
        header ??= node.type.name === 'header' ? node : undefined;
        return !header;
    });
    return header?.toJSON();
}

const titleSize = (editor: EditorView) => editor.state.doc.firstChild?.firstChild?.nodeSize ?? 0;

const markup = (editor: EditorView) => serializer.serialize(editor.state.doc);

describe('Header text', () => {
    it.each([
        [full, full],
        [
            ':::header\n:::header-content\nOnly description\n:::\n:::',
            ':::header{height="s" width="m"}\n\n:::header-content\nOnly description\n:::\n\n:::',
        ],
        [
            ':::header{title="false"}\n:::header-title{size="3"}\n:::\n:::',
            ':::header{height="s" width="m" title="false"}\n\n:::header-title{size="3"}\n:::\n\n:::',
        ],
        [
            ':::header\n:::header-title\n:::\n:::header-content\n:::\n:::',
            ':::header{height="s" width="m"}\n:::',
        ],
        [
            '> :::header\n> :::header-title\n> Quoted\n> :::\n> :::',
            '> :::header{height="s" width="m"}\n>\n> :::header-title\n> Quoted\n> :::\n>\n> :::',
        ],
        [
            '- :::header{description="false"}\n  :::header-content\n  Kept\n  :::\n  :::\n- Next',
            '- :::header{height="s" width="m" description="false"}\n\n  :::header-content\n  Kept\n  :::\n\n  :::\n\n- Next',
        ],
    ])('should round trip text slots in %j', (source, serialized) => {
        const doc = markupParser.parse(source);
        expect(serializer.serialize(doc)).toBe(serialized);
        expect(serializer.serialize(markupParser.parse(serialized))).toBe(serialized);

        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        const parsed = DOMParser.fromSchema(schema).parse(container);
        expect(findHeaderNode(parsed)).toEqual(findHeaderNode(doc));
    });

    it('should parse preview HTML with whitespace between slots', () => {
        const container = document.createElement('div');
        container.innerHTML = [
            '<div class="g-md-header" data-height="m" data-width="m" data-description="false">',
            '<div class="g-md-header__title" data-size="1" data-color="red">',
            '<p>Team</p>',
            '</div>',
            '<div class="g-md-header__content">',
            '<p>Desc</p>',
            '</div>',
            '</div>',
        ].join('\n');
        const parsed = DOMParser.fromSchema(schema).parse(container);
        expect(serializer.serialize(parsed)).toBe(
            [
                ':::header{height="m" width="m" description="false"}',
                '',
                ':::header-title{size="1" color="red"}',
                'Team',
                ':::',
                '',
                ':::header-content',
                'Desc',
                ':::',
                '',
                ':::',
            ].join('\n'),
        );
    });

    it('should parse title and description as separate nodes', () => {
        const header = markupParser.parse(full).firstChild;
        expect(header?.child(0).type.name).toBe('header_title');
        expect(header?.child(0).attrs).toEqual({size: '1', color: 'red'});
        expect(header?.child(0).textContent).toBe('Team portal');
        expect(header?.child(1).type.name).toBe('header_content');
        expect(header?.child(1).childCount).toBe(2);
    });

    it.each([
        ':::header\n:::header-title\nA\n:::\n:::header-title\nB\n:::\n:::',
        ':::header\n:::header-content\nA\n:::\n:::header-title\nB\n:::\n:::',
        ':::header\n:::header-title{size="0"}\nA\n:::\n:::',
        ':::header\n:::header-title\nA\n:::\nLoose text\n:::',
        ':::header{title="yes"}\n:::',
    ])('should keep an unsupported body as source for %j', (source) => {
        const doc = markupParser.parse(source);
        expect(doc.firstChild?.type.name).toBe('header_source');
        expect(serializer.serialize(doc)).toBe(source);
    });

    it('should type text into empty slots', () => {
        const editor = createView(':::header\n:::');
        editor.dispatch(editor.state.tr.insertText('Title', 3));
        const contentStart = titleSize(editor) + 3;
        editor.dispatch(editor.state.tr.insertText('Description', contentStart));
        expect(markup(editor)).toBe(
            ':::header{height="s" width="m"}\n\n:::header-title\nTitle\n:::\n\n:::header-content\nDescription\n:::\n\n:::',
        );
    });

    it('should keep long text', () => {
        const text = 'Long text '.repeat(200).trim();
        const source = `:::header{height="s" width="m"}\n\n:::header-title\n${text}\n:::\n\n:::header-content\n${text}\n:::\n\n:::`;
        expect(serializer.serialize(markupParser.parse(source))).toBe(source);
    });

    it('should hide and show slots without losing content and undo each change', () => {
        const editor = createView(full);
        select(editor, 3);
        expect(
            toggleHeaderText(editor.state, editor.dispatch, editor, {
                slot: 'title',
                visible: false,
            }),
        ).toBe(true);
        expect(
            toggleHeaderText(editor.state, editor.dispatch, editor, {
                slot: 'description',
                visible: false,
            }),
        ).toBe(true);
        expect(markup(editor)).toBe(
            full.replace(
                '{height="m" width="m"}',
                '{height="m" width="m" title="false" description="false"}',
            ),
        );
        expect(editor.dom.querySelector('.g-md-header')?.getAttribute('data-title')).toBe('false');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(
            full.replace('{height="m" width="m"}', '{height="m" width="m" title="false"}'),
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(full);
    });

    it('should change title size and color and undo each change', () => {
        const editor = createView(full);
        editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)));
        expect(setHeaderTitleSize(editor.state, editor.dispatch, editor, {size: '4'})).toBe(true);
        expect(setHeaderTitleColor(editor.state, editor.dispatch, editor, {color: 'auto'})).toBe(
            true,
        );
        expect(markup(editor)).toContain(':::header-title{size="4"}\n');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toContain(':::header-title{size="4" color="red"}\n');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(full);
    });

    it('should reject invalid values, readonly views and selections outside a header', () => {
        const editor = createView(`${full}\n\nAfter`);
        select(editor, 3);
        // @ts-expect-error Unsupported sizes must also be rejected at runtime.
        expect(setHeaderTitleSize(editor.state, editor.dispatch, editor, {size: '7'})).toBe(false);
        // @ts-expect-error Unsupported colors must also be rejected at runtime.
        expect(setHeaderTitleColor(editor.state, editor.dispatch, editor, {color: 'pink'})).toBe(
            false,
        );
        expect(
            toggleHeaderText(editor.state, editor.dispatch, editor, {
                // @ts-expect-error Unsupported slots must also be rejected at runtime.
                slot: 'button',
                visible: false,
            }),
        ).toBe(false);
        select(editor, editor.state.doc.content.size - 1);
        expect(setHeaderTitleSize(editor.state, editor.dispatch, editor, {size: '3'})).toBe(false);

        const readonly = createView(full, false);
        select(readonly, 3);
        expect(setHeaderTitleSize(readonly.state, readonly.dispatch, readonly, {size: '3'})).toBe(
            false,
        );
    });

    it('should change the title size with Mod-Alt-1 to Mod-Alt-6 only inside the title', () => {
        const editor = createView(full);
        select(editor, 3);
        for (const size of ['1', '2', '3', '4', '5', '6']) {
            expect(
                headerTitleSizeKeymap[`Mod-Alt-${size}`](editor.state, editor.dispatch, editor),
            ).toBe(true);
            expect(editor.state.doc.firstChild?.firstChild?.attrs.size).toBe(size);
        }
        const contentStart = titleSize(editor) + 3;
        select(editor, contentStart);
        expect(headerTitleSizeKeymap['Mod-Alt-1'](editor.state, editor.dispatch, editor)).toBe(
            false,
        );
    });
});

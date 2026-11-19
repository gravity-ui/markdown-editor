// @vitest-environment jsdom
import {ToolbarDataType} from '@gravity-ui/markdown-editor';
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {Placeholder, SelectionContext} from '@gravity-ui/markdown-editor/extensions';
import {DOMParser, DOMSerializer, Fragment} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs, BoldSpecs, ListsSpecs} from '@gravity-ui/markdown-editor/specs';
import {headerTitleColors, headerTitleSizes} from '@gravity-ui/markdown-plugin-header';
import {act} from 'react-dom/test-utils';
import {describe, expect, it} from 'vitest';

import {
    countNodes,
    createTestEditor,
    header,
    headerExtensions,
    setCursor,
    textPos,
} from '../../../../tests/editor';
import {createEditorWithRenderer, settle} from '../../../../tests/toolbar';
import {HeaderSpecs} from '../Header/HeaderSpecs';

import {headerTitleNodeName, headerTitleNodeType} from './HeaderTitleSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(BoldSpecs).use(ListsSpecs).use(HeaderSpecs),
}).buildDeps();

const editing = createTestEditor(
    headerExtensions((builder) => builder.use(BoldSpecs).use(Placeholder, {})),
);
const {createView, markup: editorMarkup} = editing;
const custom = createTestEditor(
    headerExtensions((builder) => builder.use(Placeholder, {[headerTitleNodeName]: 'Title'})),
);
const TITLE_POS = 1;
const titleDom = (editor: EditorView) => editor.nodeDOM(TITLE_POS) as HTMLElement;

const roundTrip = (markup: string) => serializer.serialize(markupParser.parse(markup));

const sizes = ['omitted', ...headerTitleSizes] as const;
const colors = ['omitted', ...headerTitleColors] as const;

describe('Header title extension', () => {
    it('should parse the title as a block of plain text with its size and color', () => {
        const doc = markupParser.parse('::header-title[Team portal]{size="1" color="red"}');
        expect(doc.childCount).toBe(1);
        const title = doc.child(0);
        expect(title.type).toBe(headerTitleNodeType(schema));
        expect(title.type.name).toBe(headerTitleNodeName);
        expect(title.attrs).toEqual({size: 1, color: 'red'});
        expect(title.textContent).toBe('Team portal');
        expect(title.childCount).toBe(1);
        expect(title.child(0).marks).toEqual([]);
    });

    it('should use the same defaults in the schema and the parser', () => {
        const defaults = {size: 2, color: 'auto'};
        expect(headerTitleNodeType(schema).create().attrs).toEqual(defaults);
        expect(markupParser.parse('::header-title[Team portal]').child(0).attrs).toEqual(defaults);
    });

    it.each([
        ...colors.map((color, index) => ({size: sizes[(index + 1) % sizes.length], color})),
        ...sizes.map((size, index) => ({size, color: colors[(index + 3) % colors.length]})),
        {size: 2, color: 'auto'},
    ] as const)('should round trip the title with size $size and color $color', ({size, color}) => {
        const written = [
            size === 'omitted' || size === 2 ? '' : `size="${size}"`,
            color === 'omitted' || color === 'auto' ? '' : `color="${color}"`,
        ]
            .filter(Boolean)
            .join(' ');
        const attrs = [
            size === 'omitted' ? '' : `size="${size}"`,
            color === 'omitted' ? '' : `color="${color}"`,
        ]
            .filter(Boolean)
            .join(' ');
        const markup = header(`::header-title[Team portal]${attrs && `{${attrs}}`}`);
        const doc = markupParser.parse(markup);
        expect(doc.child(0).child(0).attrs).toEqual({
            size: size === 'omitted' ? 2 : size,
            color: color === 'omitted' ? 'auto' : color,
        });
        expect(serializer.serialize(doc)).toBe(
            header(`::header-title[Team portal]${written && `{${written}}`}`),
        );
    });

    it.each([
        ['::header-title[Team portal]{size="7" color="pink"}', '::header-title[Team portal]'],
        ['::header-title[Team portal]{unknown="value" .custom}', '::header-title[Team portal]'],
        [
            '::header-title[Team portal]{color=red size=3}',
            '::header-title[Team portal]{size="3" color="red"}',
        ],
        ['::header-title[  Team portal  ]', '::header-title[Team portal]'],
    ])('should write %j in the normal form', (markup, serialized) => {
        expect(roundTrip(markup)).toBe(serialized);
    });

    it.each([
        '::header-title[**bold** *italic* `code` ~~strike~~ ++underline++]',
        '::header-title[# Heading - item 1. item > quote]',
        '::header-title[<b>bold</b> & &amp; &copy; $x$ a_b_c {braces} a|b]',
        '::header-title[a \\] bracket, a \\[ bracket and a \\\\ backslash]',
        '::header-title[Заголовок баннера 🚀]{size="1" color="violet"}',
    ])('should keep the text of %j as written', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.child(0).type.name).toBe(headerTitleNodeName);
        expect(doc.child(0).childCount).toBe(1);
        expect(roundTrip(markup)).toBe(markup);
        expect(markupParser.parse(roundTrip(markup)).toJSON()).toEqual(doc.toJSON());
    });

    it('should escape the brackets of the text', () => {
        const markup = '::header-title[[link](/page) and ![image](/a.png)]';
        const serialized = '::header-title[\\[link\\](/page) and !\\[image\\](/a.png)]';
        const doc = markupParser.parse(markup);
        expect(doc.child(0).textContent).toBe('[link](/page) and ![image](/a.png)');
        expect(serializer.serialize(doc)).toBe(serialized);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
    });

    it.each([
        ['a line break', 'Team\nportal'],
        ['line breaks and spaces', 'Team \r\n\n  portal'],
        ['line breaks at the ends', '\nTeam portal\r\n'],
    ])('should write a title text with %s on one line', (_name, text) => {
        const doc = schema.node('doc', null, [
            headerTitleNodeType(schema).create(null, schema.text(text)),
        ]);
        const serialized = serializer.serialize(doc);
        expect(serialized).toBe('::header-title[Team portal]');
        expect(markupParser.parse(serialized).child(0).type.name).toBe(headerTitleNodeName);
    });

    it('should keep an empty title', () => {
        const doc = markupParser.parse('::header-title[]{size="1"}');
        expect(doc.child(0).type.name).toBe(headerTitleNodeName);
        expect(doc.child(0).childCount).toBe(0);
        expect(serializer.serialize(doc)).toBe('::header-title[]{size="1"}');
    });

    it.each([
        ':::header\n\n::header-title[Team portal]\n\nPortal description.\n\n:::',
        ':::header\n\nPortal description.\n\n::header-title[Team portal]\n\n:::',
        'Before\n\n::header-title[Outside a header]\n\nAfter',
        '- ::header-title[In a list]{color="blue"}',
    ])('should round trip the title among other blocks in the source order in %j', (markup) => {
        const doc = markupParser.parse(markup);
        let titles = 0;
        doc.descendants((node) => {
            if (node.type.name === headerTitleNodeName) titles++;
        });
        expect(titles).toBe(markup.match(/::header-title\[/g)?.length);
        expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
    });

    it('should parse a second title of a header as a paragraph', () => {
        const doc = markupParser.parse(header('::header-title[First]', '::header-title[Second]'));
        expect(doc.child(0).child(0).type.name).toBe(headerTitleNodeName);
        expect(doc.child(0).child(1).type.name).toBe('paragraph');
        expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
    });

    it('should leave a title without brackets as a paragraph', () => {
        expect(markupParser.parse('::header-title{size="1"}').child(0).type.name).toBe('paragraph');
    });

    it('should reject marks and blocks in the content', () => {
        const type = headerTitleNodeType(schema);
        expect(type.spec.marks).toBe('');
        expect(type.allowsMarkType(schema.marks.strong)).toBe(false);
        expect(type.validContent(Fragment.from(schema.text('Title')))).toBe(true);
        expect(type.validContent(Fragment.from(schema.nodes.paragraph.create()))).toBe(false);
    });

    it('should render the element of the preview and read it back', () => {
        const doc = markupParser.parse('::header-title[Team portal]{size="3" color="green"}');
        const dom = DOMSerializer.fromSchema(schema).serializeNode(doc.child(0)) as HTMLElement;
        expect(dom.outerHTML).toBe(
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_3 g-md-header-title-plugin_color_green" data-size="3" data-color="green">Team portal</div>',
        );
        const container = document.createElement('div');
        container.append(dom);
        const parsed = DOMParser.fromSchema(schema).parse(container);
        expect(parsed.child(0).toJSON()).toEqual(doc.child(0).toJSON());
    });

    it('should render the title like the preview and update it', () => {
        const editor = createView(header('::header-title[Team portal]{size="3" color="green"}'));
        expect(titleDom(editor).outerHTML).toBe(
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_3 g-md-header-title-plugin_color_green" data-size="3" data-color="green">Team portal</div>',
        );
        editor.dispatch(
            editor.state.tr
                .setNodeAttribute(TITLE_POS, 'size', 2)
                .setNodeAttribute(TITLE_POS, 'color', 'auto'),
        );
        expect(titleDom(editor).outerHTML).toBe(
            '<div class="g-md-header-title-plugin g-md-header-title-plugin_size_2">Team portal</div>',
        );
    });

    it('should not touch the attributes of the element when only the text changes', () => {
        const editor = createView(header('::header-title[Team portal]{size="1"}'));
        const dom = titleDom(editor);
        const records: MutationRecord[] = [];
        const observer = new MutationObserver((list) => records.push(...list));
        observer.observe(dom, {attributes: true});
        editor.dispatch(editor.state.tr.insertText('!', 13));
        records.push(...observer.takeRecords());
        observer.disconnect();
        expect(titleDom(editor)).toBe(dom);
        expect(dom.textContent).toBe('Team portal!');
        expect(records).toEqual([]);
    });

    it('should type plain text and drop the marks of inserted text', () => {
        const editor = createView(header('::header-title[Team]'));
        setCursor(editor, 6);
        const {strong} = editing.schema.marks;
        editor.dispatch(
            editor.state.tr
                .addStoredMark(strong.create())
                .insertText(' portal', 6)
                .scrollIntoView(),
        );
        expect(editor.state.doc.nodeAt(TITLE_POS)?.child(0).marks).toEqual([]);
        expect(editorMarkup(editor)).toBe(header('::header-title[Team portal]'));
    });

    it.each([
        ['<p>one</p><p>two</p>', 'Team one two portal'],
        ['<h1>one</h1>', 'Team one portal'],
        ['<b>one</b>', 'Team one portal'],
    ])('should keep one plain title when pasting %j', (html, text) => {
        const editor = createView(header('::header-title[Team  portal]', 'Text'));
        setCursor(editor, 7);
        editor.pasteHTML(html, new Event('paste') as ClipboardEvent);
        expect(countNodes(editor, headerTitleNodeName)).toBe(1);
        const title = editor.state.doc.nodeAt(TITLE_POS);
        expect(title?.type.name).toBe(headerTitleNodeName);
        expect(title?.textContent.replace(/\s+/g, ' ')).toBe(text);
        expect(title?.child(0).marks).toEqual([]);
    });

    it.each([
        ['::header-title[]', true],
        ['::header-title[Team portal]', false],
    ])('should show a placeholder only in the empty title %j', (title, shown) => {
        const editor = createView(header(title, 'Text'));
        const placeholder = titleDom(editor).querySelector('.g-md-placeholder');
        expect(Boolean(placeholder)).toBe(shown);
        if (shown) expect(placeholder?.textContent).toBe('Banner title');
        expect(editorMarkup(editor)).toBe(header(title, 'Text'));
    });

    it('should hide the placeholder after typing', () => {
        const editor = createView(header('::header-title[]'));
        editor.dispatch(editor.state.tr.insertText('T', 2));
        expect(titleDom(editor).querySelector('.g-md-placeholder')).toBeNull();
        expect(editorMarkup(editor)).toBe(header('::header-title[T]'));
    });

    it('should show the placeholder of the editor option', () => {
        const editor = custom.createView(header('::header-title[]', 'Text'));
        const placeholder = titleDom(editor).querySelector('.g-md-placeholder');
        expect(placeholder?.textContent).toBe('Title');
        expect(custom.markup(editor)).toBe(header('::header-title[]', 'Text'));
    });
});

describe('Selection toolbar over the header title', () => {
    const {start} = createEditorWithRenderer((builder) =>
        builder.use(SelectionContext, {
            config: [
                [
                    {
                        id: 'bold',
                        type: ToolbarDataType.SingleButton,
                        icon: {data: () => null},
                        title: 'Bold',
                        isActive: () => false,
                        isEnable: () => true,
                        exec: () => {},
                    },
                ],
            ],
        }),
    );
    const selectionToolbar = () => document.querySelector('[data-qa="g-md-toolbar-selection"]');

    it.each([
        ['the title', 'Team portal', false],
        ['a paragraph', 'Portal description.', true],
    ])('should show the selection toolbar over %s: %s', async (_name, text, shown) => {
        const view = await start(header('::header-title[Team portal]', 'Portal description.'));
        view.coordsAtPos = () => ({left: 0, right: 0, top: 0, bottom: 0});
        const from = textPos(view, text);
        await act(async () => setCursor(view, from + 1, from + 5));
        await settle();
        expect(Boolean(selectionToolbar())).toBe(shown);
    });
});

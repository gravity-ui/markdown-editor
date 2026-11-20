// @vitest-environment jsdom
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {BoldSpecs, ItalicSpecs, LinkSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {headerContentMarkup} from '../../../../tests/content';
import {createTestEditor, headerExtensions, header as headerMarkup} from '../../../../tests/editor';
import {TestParts, testImage, testTitle} from '../../../../tests/parts';
import {type RemovedParts, setHeaderPart, toggleHeaderPart} from '../Header/commands';
import {headerPartTypes, headerParts} from '../Header/parts';
import {runCommand} from '../commands';

import {headerContentNodeName} from './HeaderContentSpecs';

const {schema, createView, markup} = createTestEditor(
    headerExtensions((builder) =>
        builder
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(LinkSpecs)
            .use(TestParts([testImage, testTitle])),
    ),
);

const {p, header, image, title, content, strong, em, link} = builders(schema, {
    p: {nodeType: 'paragraph'},
    header: {nodeType: 'header'},
    image: {nodeType: testImage},
    title: {nodeType: testTitle},
    content: {nodeType: headerContentNodeName},
    strong: {markType: 'strong'},
    em: {markType: 'em'},
    link: {markType: 'link', href: '/page'},
}) as unknown as Record<string, (...content: (Node | string | object)[]) => Node>;

const SAMPLE = 'Here you will find the main rules and recommendations for working in our services';

function editorWith(banner: Node) {
    const editor = createView('');
    const tr = editor.state.tr.replaceWith(0, editor.state.doc.content.size, banner);
    editor.dispatch(tr.setSelection(TextSelection.atStart(tr.doc)));
    return editor;
}

const banner = (editor: {state: {doc: Node}}) => editor.state.doc.child(0);
const switchContent = (editor: ReturnType<typeof createView>, on: boolean, removed: RemovedParts) =>
    runCommand(editor, toggleHeaderPart(0, 'content', on, removed));

describe('Header content switch', () => {
    it('should register the description as the content part', () => {
        expect(headerPartTypes(schema).content?.name).toBe(headerContentNodeName);
    });

    it('should add a description with a sample text to an empty banner', () => {
        const editor = createView(headerMarkup());
        expect(headerParts(banner(editor)).content).toBe(false);
        expect(runCommand(editor, setHeaderPart(0, 'content', true))).toBe(true);
        expect(banner(editor).eq(header(content(p(SAMPLE))))).toBe(true);
        expect(markup(editor)).toBe(headerMarkup(headerContentMarkup([SAMPLE])));
    });

    it('should turn the only paragraph into the description and keep its marks', () => {
        const paragraph = p('Read ', strong('the ', em('team')), ' ', link('page'), '.');
        const editor = editorWith(header(paragraph));
        expect(runCommand(editor, setHeaderPart(0, 'content', true))).toBe(true);
        expect(banner(editor).eq(header(content(paragraph)))).toBe(true);
        expect(markup(editor)).toBe(
            headerMarkup(headerContentMarkup(['Read **the *team*** [page](/page).'])),
        );
    });

    it('should add the description after a paragraph that is not the only block', () => {
        const editor = editorWith(header(p('One'), p('Two')));
        expect(runCommand(editor, setHeaderPart(0, 'content', true))).toBe(true);
        expect(banner(editor).eq(header(content(p(SAMPLE)), p('One'), p('Two')))).toBe(true);
    });

    it.each([
        {
            name: 'several paragraphs with marks and links',
            node: () =>
                content(
                    p('First ', strong('bold'), ' and ', em('italic'), '.'),
                    p('Read the ', link(strong('docs')), '.'),
                    p('Third.'),
                ),
        },
        {name: 'an empty paragraph', node: () => content(p())},
    ])('should restore the same description with $name after switching off and on', ({node}) => {
        const description = node();
        const editor = editorWith(header(description, p('After')));
        const removed: RemovedParts = new Map();
        expect(switchContent(editor, false, removed)).toBe(true);
        expect(banner(editor).eq(header(p('After')))).toBe(true);
        expect(switchContent(editor, true, removed)).toBe(true);
        expect(banner(editor).eq(header(description, p('After')))).toBe(true);
        expect(banner(editor).firstChild).toBe(removed.get('content'));
    });

    it('should keep an empty paragraph after removing the only description', () => {
        const editor = editorWith(header(content(p('Text'))));
        expect(runCommand(editor, setHeaderPart(0, 'content', false))).toBe(true);
        expect(banner(editor).eq(header(p()))).toBe(true);
    });

    it('should undo each switch in one step', () => {
        const source = header(content(p('First ', strong('bold')), p('Second')));
        const editor = editorWith(source);
        const removed: RemovedParts = new Map();
        switchContent(editor, false, removed);
        switchContent(editor, true, removed);
        expect(banner(editor).eq(source)).toBe(true);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(banner(editor).eq(header(p()))).toBe(true);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(banner(editor).eq(source)).toBe(true);
    });

    it.each([
        {
            name: 'after the image and the title',
            blocks: () => [image(), title('Title'), p('Text')],
            expected: () => [image(), title('Title'), content(p(SAMPLE)), p('Text')],
        },
        {
            name: 'after the title before other blocks',
            blocks: () => [p('Before'), title('Title'), p('Text')],
            expected: () => [p('Before'), title('Title'), content(p(SAMPLE)), p('Text')],
        },
        {
            name: 'first without other parts',
            blocks: () => [p('One'), p('Two')],
            expected: () => [content(p(SAMPLE)), p('One'), p('Two')],
        },
    ])('should insert the description $name', ({blocks, expected}) => {
        const editor = editorWith(header(...blocks()));
        expect(runCommand(editor, setHeaderPart(0, 'content', true))).toBe(true);
        expect(banner(editor).eq(header(...expected()))).toBe(true);
    });

    it('should keep the parts before the description when the title is switched on', () => {
        const editor = editorWith(header(content(p('Text'))));
        expect(runCommand(editor, setHeaderPart(0, 'title', true))).toBe(true);
        expect(runCommand(editor, setHeaderPart(0, 'image', true))).toBe(true);
        expect(banner(editor).eq(header(image(), title('Title'), content(p('Text'))))).toBe(true);
    });
});

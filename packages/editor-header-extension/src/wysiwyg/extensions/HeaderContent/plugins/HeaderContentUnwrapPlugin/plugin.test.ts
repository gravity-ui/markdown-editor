// @vitest-environment jsdom
import {pType} from '@gravity-ui/markdown-editor';
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {Fragment, Slice} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {describe, expect, it} from 'vitest';

import {description, headerContentMarkup} from '../../../../../../tests/content';
import {countNodes, createTestEditor, header} from '../../../../../../tests/editor';
import {runCommand} from '../../../commands';
import {headerContentNodeName, headerContentNodeType} from '../../HeaderContentSpecs';

import {misplacedHeaderContents} from './plugin';

const {createView, markup, schema, markupParser} = createTestEditor();

const HEADER_END = 25;
const paragraph = (text: string) => pType(schema).create(null, schema.text(text));
const content = (...texts: string[]) =>
    headerContentNodeType(schema).create(null, texts.map(paragraph));
const insert = (editor: EditorView, pos: number, ...nodes: ReturnType<typeof content>[]) =>
    editor.dispatch(editor.state.tr.insert(pos, Fragment.from(nodes)));

describe('Header content unwrapping', () => {
    it('should turn a description pasted outside a banner into its blocks', () => {
        const editor = createView(`${header(description)}\n\nAfter`);
        const slice = new Slice(Fragment.from(content('Pasted.', 'Second.')), 0, 0);
        editor.dispatch(editor.state.tr.replace(HEADER_END, editor.state.doc.content.size, slice));
        expect(markup(editor)).toBe(`${header(description)}\n\nPasted.\n\nSecond.`);
        expect(countNodes(editor, headerContentNodeName)).toBe(1);
    });

    it.each([
        ['after the description', 24, header(description, 'Pasted.')],
        [
            'before the description',
            1,
            header(headerContentMarkup(['Pasted.']), 'Portal description.'),
        ],
    ])(
        'should keep the first description of a banner when one is inserted %s',
        (_name, pos, md) => {
            const editor = createView(header(description));
            insert(editor, pos, content('Pasted.'));
            expect(markup(editor)).toBe(md);
            expect(countNodes(editor, headerContentNodeName)).toBe(1);
        },
    );

    it('should turn a description inside a description into its blocks', () => {
        const editor = createView(header(description));
        insert(editor, 23, content('Inner.'));
        expect(markup(editor)).toBe(header(headerContentMarkup(['Portal description.', 'Inner.'])));
    });

    it('should turn the description into its blocks when the banner is removed around it', () => {
        const editor = createView(`${header(description, 'Text')}\n\nAfter`);
        const banner = editor.state.doc.child(0);
        editor.dispatch(editor.state.tr.replaceWith(0, banner.nodeSize, banner.content));
        expect(markup(editor)).toBe('Portal description.\n\nText\n\nAfter');
    });

    it('should undo the insertion and the unwrapping in one step', () => {
        const source = `${header(description)}\n\nAfter`;
        const editor = createView(source);
        insert(editor, editor.state.doc.content.size, content('Pasted.'));
        expect(markup(editor)).toBe(`${source}\n\nPasted.`);
        expect(runCommand(editor, undo)).toBe(true);
        expect(markup(editor)).toBe(source);
    });

    it('should keep the document when the text of a description changes', () => {
        const editor = createView(`${header(description)}\n\n${header(description)}`);
        editor.dispatch(editor.state.tr.insertText(' More.', 22));
        expect(markup(editor)).toBe(
            `${header(headerContentMarkup(['Portal description. More.']))}\n\n${header(description)}`,
        );
        expect(countNodes(editor, headerContentNodeName)).toBe(2);
    });

    it('should find the descriptions outside a banner and after the first one', () => {
        const doc = schema.node('doc', null, [
            schema.node('header', null, [content('First.'), content('Second.')]),
            content('Outside.'),
            schema.node('header', null, [paragraph('Text'), content('Only.')]),
        ]);
        const first = doc.child(0);
        expect(misplacedHeaderContents(doc)).toEqual([1 + first.child(0).nodeSize, first.nodeSize]);
        expect(misplacedHeaderContents(markupParser.parse(header(description)))).toEqual([]);
    });
});

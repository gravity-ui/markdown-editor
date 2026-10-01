import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {headerNodeName} from './HeaderSpecs/const';
import {
    getHeaderSchemaSpec,
    getHeaderTitleSpec,
    headerActionSpec,
    headerActionsSpec,
    headerContentSpec,
} from './HeaderSpecs/schema';
import {
    backspaceInHeader,
    enterHeaderContent,
    exitHeaderForward,
    generateHeaderLook,
    removeHeader,
    removeHeaderImage,
    setHeaderAttrs,
    toHeader,
} from './commands';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*', toDOM: () => ['p', 0]},
        [headerNodeName]: getHeaderSchemaSpec(),
        header_title: getHeaderTitleSpec(),
        header_content: headerContentSpec,
        header_actions: headerActionsSpec,
        header_action: headerActionSpec,
    },
});

const cover = (title = '', attrs: Record<string, unknown> = {}) =>
    schema.nodes.header.create(attrs, [
        schema.nodes.header_title.create(null, title ? schema.text(title) : null),
        schema.nodes.header_content.create(),
        schema.nodes.header_actions.create(),
    ]);
const doc = (...nodes: ReturnType<typeof cover>[]) => schema.nodes.doc.create(null, nodes);
const paragraph = (text = '') =>
    schema.nodes.paragraph.create(null, text ? schema.text(text) : null);

const viewWith = (pmDoc: ReturnType<typeof doc>, pos: number) =>
    new EditorView(null, {
        state: EditorState.create({
            schema,
            doc: pmDoc,
            selection: TextSelection.create(pmDoc, pos),
        }),
    });

describe('Header commands', () => {
    it('should change and normalize attributes', () => {
        const view = viewWith(doc(cover('Заголовок')), 2);
        expect(setHeaderAttrs(0, {format: 'small', fill: 'red'})(view.state, view.dispatch)).toBe(
            true,
        );
        expect(view.state.doc.firstChild?.attrs.fill).toBe('red');
        expect(setHeaderAttrs(0, {fill: 'unknown'})(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild?.attrs.fill).toBe('blue');
    });

    it('should generate a named layout', () => {
        const view = viewWith(doc(cover('Заголовок')), 2);
        expect(generateHeaderLook(0)(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild?.attrs.fill).not.toBe('blue');
        expect(view.state.doc.firstChild?.attrs.shapes).not.toBe('diagonal');
    });

    it('should remove the image and its image settings', () => {
        const view = viewWith(
            doc(
                cover('Заголовок', {
                    image: 'https://example.com/hero.png',
                    layer: 'object',
                    fit: 'whole',
                    focus: 'right',
                    effect: 'darken',
                    text: 'light',
                }),
            ),
            2,
        );
        expect(removeHeaderImage(0)(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild?.attrs).toMatchObject({
            image: '',
            layer: 'full',
            fit: 'crop',
            focus: 'center',
            effect: 'none',
            text: 'auto',
        });
    });

    it('should insert a cover after the paragraph', () => {
        const view = viewWith(doc(paragraph('Текст')), 1);
        expect(toHeader(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.child(1).type.name).toBe('header');
        expect(view.state.doc.child(1).childCount).toBe(3);
    });

    it('should create a subtitle paragraph when Enter is pressed in the title', () => {
        const view = viewWith(doc(cover('Заголовок')), 2);
        expect(enterHeaderContent(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild?.child(1).firstChild?.type.name).toBe('paragraph');
    });

    it('should leave the cover on Mod-Enter', () => {
        const view = viewWith(doc(cover('Заголовок')), 2);
        expect(exitHeaderForward(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.child(1).type.name).toBe('paragraph');
    });

    it('should replace an empty cover with a paragraph on Backspace', () => {
        const view = viewWith(doc(cover()), 2);
        expect(backspaceInHeader(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild?.type.name).toBe('paragraph');
    });

    it('should remove a cover', () => {
        const view = viewWith(doc(cover('Заголовок'), paragraph('Текст')), 2);
        expect(removeHeader(0)(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild?.type.name).toBe('paragraph');
    });
});

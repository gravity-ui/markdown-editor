import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {getHeaderSchemaSpec} from './HeaderSpecs/schema';
import {headerNodeName} from './HeaderSpecs/const';
import {
    backspaceInHeader,
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
    },
});

const {doc, paragraph: p, header} = builders(schema);

const viewWith = (pmDoc: ReturnType<typeof doc>, pos: number) =>
    new EditorView(null, {
        state: EditorState.create({
            schema,
            doc: pmDoc,
            selection: TextSelection.create(pmDoc, pos),
        }),
    });

describe('Header commands', () => {
    it('should change several attributes at once', () => {
        const view = viewWith(doc(header('Заголовок')), 1);

        expect(setHeaderAttrs(0, {format: 'small', fill: 'red'})(view.state, view.dispatch)).toBe(
            true,
        );
        expect(view.state.doc.firstChild!.attrs.format).toBe('small');
        expect(view.state.doc.firstChild!.attrs.fill).toBe('red');
    });

    it('should refuse to change attributes of a missing node', () => {
        const view = viewWith(doc(p('текст')), 1);
        expect(setHeaderAttrs(0, {format: 'small'})(view.state, view.dispatch)).toBe(false);
    });

    it('should refuse to repeat the current attributes', () => {
        const view = viewWith(doc(header({format: 'small'}, 'Заголовок')), 1);
        expect(setHeaderAttrs(0, {format: 'small'})(view.state, view.dispatch)).toBe(false);
    });

    it('should write a new look into attributes', () => {
        const view = viewWith(doc(header({fill: 'blue', seed: 0}, 'Заголовок')), 1);

        expect(generateHeaderLook(0)(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild!.attrs.fill).not.toBe('blue');
        expect(view.state.doc.firstChild!.attrs.seed).toBeGreaterThan(0);
    });

    it('should take the image away with its overlay and measured tone', () => {
        const view = viewWith(
            doc(
                header(
                    {image: 'https://example.com/hero.png', effect: 'dim', text: 'light'},
                    'Заголовок',
                ),
            ),
            1,
        );

        expect(removeHeaderImage(0)(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild!.attrs.image).toBe('');
        expect(view.state.doc.firstChild!.attrs.effect).toBe('none');
        expect(view.state.doc.firstChild!.attrs.text).toBe('auto');
    });

    it('should refuse to take away a missing image', () => {
        const view = viewWith(doc(header('Заголовок')), 1);
        expect(removeHeaderImage(0)(view.state, view.dispatch)).toBe(false);
    });

    it('should insert a header instead of an empty paragraph position', () => {
        const view = viewWith(doc(p('текст')), 1);

        expect(toHeader(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.childCount).toBe(2);
        expect(view.state.doc.child(1).type.name).toBe(headerNodeName);
    });

    it('should refuse to nest a header into a header', () => {
        const view = viewWith(doc(header('Заголовок')), 1);
        expect(toHeader(view.state, view.dispatch)).toBe(false);
    });

    it('should add a paragraph after the header on exit', () => {
        const view = viewWith(doc(header('Заголовок')), 1);

        expect(exitHeaderForward(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.childCount).toBe(2);
        expect(view.state.doc.child(1).type.name).toBe('paragraph');
    });

    it('should reuse the paragraph that already follows the header', () => {
        const view = viewWith(doc(header('Заголовок'), p('текст')), 1);

        expect(exitHeaderForward(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.childCount).toBe(2);
        expect(view.state.selection.from).toBe(view.state.doc.firstChild!.nodeSize + 1);
    });

    it('should leave the document alone outside a header', () => {
        const view = viewWith(doc(p('текст')), 1);
        expect(exitHeaderForward(view.state, view.dispatch)).toBe(false);
        expect(backspaceInHeader(view.state, view.dispatch)).toBe(false);
    });

    it('should replace an empty header with a paragraph on backspace', () => {
        const view = viewWith(doc(header()), 1);

        expect(backspaceInHeader(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.childCount).toBe(1);
        expect(view.state.doc.firstChild!.type.name).toBe('paragraph');
    });

    it('should keep a non-empty header on backspace at its start', () => {
        const pmDoc = doc(p('текст'), header('Заголовок'));
        const view = viewWith(pmDoc, pmDoc.firstChild!.nodeSize + 1);
        const before = view.state.doc;

        expect(backspaceInHeader(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc).toBe(before);
    });

    it('should remove the header', () => {
        const view = viewWith(doc(header('Заголовок'), p('текст')), 1);

        expect(removeHeader(0)(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.childCount).toBe(1);
        expect(view.state.doc.firstChild!.type.name).toBe('paragraph');
    });
});

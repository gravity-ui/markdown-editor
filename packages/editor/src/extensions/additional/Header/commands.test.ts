import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {buttonSpec} from '../Button/ButtonSpecs';

import {
    getHeaderSchemaSpec,
    getHeaderTitleSpec,
    headerActionsSpec,
    headerContentSpec,
    headerImageSpec,
} from './HeaderSpecs/schema';
import {
    backspaceInHeader,
    enterHeaderContent,
    exitHeaderForward,
    removeHeaderImage,
    setHeaderAttrs,
    setHeaderButton,
    setHeaderMedia,
    setSelectedHeaderTitleSize,
    toHeader,
} from './commands';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*', toDOM: () => ['p', 0]},
        heading: {
            group: 'block',
            content: 'inline*',
            attrs: {level: {default: 1}},
            toDOM: (node) => ['h' + node.attrs.level, 0],
        },
        header: getHeaderSchemaSpec(),
        header_title: getHeaderTitleSpec(),
        header_content: headerContentSpec,
        header_actions: headerActionsSpec,
        header_image: headerImageSpec,
        button: buttonSpec,
    },
});
const cover = (title = '', attrs = {}) =>
    schema.nodes.header.create(attrs, [
        schema.nodes.header_title.create(null, title ? schema.text(title) : null),
        schema.nodes.header_content.create(),
        schema.nodes.header_actions.create(),
        schema.nodes.header_image.create(),
    ]);
const viewWith = (node = cover()) => {
    const doc = schema.nodes.doc.create(null, node);
    return new EditorView(null, {
        state: EditorState.create({schema, doc, selection: TextSelection.create(doc, 2)}),
    });
};

describe('Header commands', () => {
    it('should change title size from its selection without replacing the title node', () => {
        const view = viewWith(cover('Title', {}));
        for (const size of ['1', '2', '3', '4', '5', '6']) {
            expect(setSelectedHeaderTitleSize(size)(view.state, view.dispatch)).toBe(true);
            expect(view.state.doc.firstChild?.firstChild?.type.name).toBe('header_title');
            expect(view.state.doc.firstChild?.firstChild?.attrs.size).toBe(size);
            expect(view.state.doc.firstChild?.firstChild?.textContent).toBe('Title');
        }
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 10)));
        expect(setSelectedHeaderTitleSize('1')(view.state, view.dispatch)).toBe(false);
        view.destroy();
    });
    it('should change normalized attributes and leave unchanged documents untouched', () => {
        const view = viewWith();
        expect(setHeaderAttrs(0, {height: 'm'})(view.state, view.dispatch)).toBe(true);
        expect(setHeaderAttrs(0, {height: 'm'})(view.state, view.dispatch)).toBe(false);
        expect(setHeaderAttrs(100, {height: 'm'})(view.state, view.dispatch)).toBe(false);
        expect(view.state.doc.firstChild?.attrs.height).toBe('m');
        view.destroy();
    });
    it('should preserve text and theme preferences when a background is removed', () => {
        const view = viewWith(
            cover('Title', {image: '/bg.png', text: 'blue', 'bg-image-theme': 'dark'}),
        );
        removeHeaderImage(0)(view.state, view.dispatch);
        expect(view.state.doc.firstChild?.attrs).toMatchObject({
            image: '',
            text: 'blue',
            'bg-image-theme': 'dark',
        });
        view.destroy();
    });
    it('should retain independent content and background images', () => {
        const view = viewWith(cover('Title', {image: '/bg.png'}));
        setHeaderMedia(0, {src: '/content.png', alt: 'Picture', enabled: 'true'})(
            view.state,
            view.dispatch,
        );
        setHeaderAttrs(0, {align: 'center'})(view.state, view.dispatch);
        expect(view.state.doc.firstChild?.child(3).attrs).toMatchObject({
            src: '/content.png',
            enabled: 'true',
        });
        expect(view.state.doc.firstChild?.attrs.image).toBe('/bg.png');
        view.destroy();
    });
    it('should keep three independent button slots when toggled', () => {
        const view = viewWith();
        setHeaderButton(0, 2, {label: 'Third', href: '/page', 'new-tab': true})(
            view.state,
            view.dispatch,
        );
        expect(view.state.doc.firstChild?.child(2).firstChild?.attrs.enabled).toBe(false);
        setHeaderButton(0, 2, {enabled: false})(view.state, view.dispatch);
        setHeaderButton(0, 0, {label: 'First', enabled: true})(view.state, view.dispatch);
        setHeaderButton(0, 2, {enabled: true})(view.state, view.dispatch);
        expect(view.state.doc.firstChild?.child(2).child(2).attrs).toMatchObject({
            label: 'Third',
            href: '/page',
            'new-tab': true,
            enabled: true,
        });
        expect(setHeaderButton(0, 3, {label: 'Fourth'})(view.state, view.dispatch)).toBe(false);
        view.destroy();
    });
    it('should create the default cover with a button and content image slot', () => {
        const view = viewWith(schema.nodes.paragraph.create());
        expect(toHeader(view.state, view.dispatch)).toBe(true);
        const header = view.state.doc.child(1);
        expect(header.childCount).toBe(4);
        expect(header.child(2).firstChild?.attrs.label).toBe('Button');
        expect(header.child(3).attrs.enabled).toBe('true');
        view.destroy();
    });
    it('should navigate from title to content and then outside the cover', () => {
        const view = viewWith(cover('Title'));
        expect(enterHeaderContent(view.state, view.dispatch)).toBe(true);
        expect(view.state.selection.$from.parent.type.name).toBe('paragraph');
        expect(exitHeaderForward(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.lastChild?.type.name).toBe('paragraph');
        view.destroy();
    });
    it('should replace an empty cover but preserve a cover with an image or button', () => {
        const view = viewWith();
        expect(backspaceInHeader(view.state, view.dispatch)).toBe(true);
        expect(view.state.doc.firstChild?.type.name).toBe('paragraph');
        view.destroy();
        const populated = viewWith(cover('', {image: '/bg.png'}));
        backspaceInHeader(populated.state, populated.dispatch);
        expect(populated.state.doc.firstChild?.type.name).toBe('header');
        populated.destroy();
    });
});

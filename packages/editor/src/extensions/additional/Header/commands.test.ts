import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {HeaderBackground, HeaderFormat, getSchemaSpecs} from './HeaderSpecs';
import {
    addHeaderAction,
    exitHeaderForward,
    nextHeaderSlot,
    removeEmptyAction,
    removeHeaderAction,
    setHeaderAttrs,
    toHeader,
    unwrapHeader,
} from './commands';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {
            group: 'block',
            content: 'inline*',
            parseDOM: [{tag: 'p'}],
            toDOM: () => ['p', 0],
        },
        ...getSchemaSpecs(),
    },
});

const {
    doc,
    paragraph: p,
    header_block: header,
    header_block_title: title,
    header_block_description: description,
    header_block_actions: actions,
    header_block_action: action,
} = builders(schema);

function editorAt(pmDoc: ReturnType<typeof doc>, pos: number) {
    return new EditorView(null, {
        state: EditorState.create({
            schema,
            doc: pmDoc,
            selection: TextSelection.create(pmDoc, pos),
        }),
    });
}

const filled = () =>
    doc(header(title('Title'), description('Description'), actions(action('Go'))), p('after'));

describe('Header commands', () => {
    describe('toHeader', () => {
        it('should replace an empty paragraph', () => {
            const view = editorAt(doc(p()), 1);
            expect(toHeader(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc.firstChild?.type.name).toBe('header_block');
            expect(view.state.doc.childCount).toBe(2);
        });

        it('should keep the text of a non-empty paragraph', () => {
            const view = editorAt(doc(p('keep me')), 3);
            expect(toHeader(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc.child(0)).toMatchNode(p('keep me'));
            expect(view.state.doc.child(1).type.name).toBe('header_block');
        });

        it('should refuse to nest a header inside a header', () => {
            const view = editorAt(filled(), 2);
            expect(toHeader(view.state, view.dispatch, view)).toBe(false);
        });

        it('should put the cursor into the title', () => {
            const view = editorAt(doc(p()), 1);
            toHeader(view.state, view.dispatch, view);
            expect(view.state.selection.$from.parent.type.name).toBe('header_block_title');
        });
    });

    describe('setHeaderAttrs', () => {
        it('should patch a single attribute', () => {
            const view = editorAt(filled(), 2);
            expect(setHeaderAttrs(0, {format: HeaderFormat.Small})(view.state, view.dispatch)).toBe(
                true,
            );
            expect(view.state.doc.firstChild?.attrs.format).toBe(HeaderFormat.Small);
        });

        it('should apply two attributes in one transaction without losing either', () => {
            const view = editorAt(filled(), 2);
            setHeaderAttrs(0, {bg: HeaderBackground.Image, image: '/hero.png'})(
                view.state,
                view.dispatch,
            );
            expect(view.state.doc.firstChild?.attrs).toMatchObject({
                bg: HeaderBackground.Image,
                image: '/hero.png',
            });
        });

        it('should not create a history entry when nothing changes', () => {
            const view = editorAt(filled(), 2);
            expect(setHeaderAttrs(0, {format: HeaderFormat.Large})(view.state, view.dispatch)).toBe(
                false,
            );
        });

        it('should refuse when the position is not a header', () => {
            const view = editorAt(filled(), 2);
            expect(
                setHeaderAttrs(999, {format: HeaderFormat.Small})(view.state, view.dispatch),
            ).toBe(false);
        });
    });

    describe('actions', () => {
        it('should append a second action', () => {
            const view = editorAt(filled(), 2);
            expect(addHeaderAction(0)(view.state, view.dispatch)).toBe(true);
            expect(view.state.doc.firstChild?.child(2).childCount).toBe(2);
        });

        it('should stop at the maximum of two', () => {
            const view = editorAt(
                doc(header(title('T'), description('S'), actions(action('a'), action('b')))),
                2,
            );
            expect(addHeaderAction(0)(view.state, view.dispatch)).toBe(false);
        });

        it('should remove an action by index', () => {
            const view = editorAt(
                doc(header(title('T'), description('S'), actions(action('a'), action('b')))),
                2,
            );
            expect(removeHeaderAction(0, 0)(view.state, view.dispatch)).toBe(true);
            expect(view.state.doc.firstChild?.child(2)).toMatchNode(actions(action('b')));
        });

        it('should refuse an out-of-range index', () => {
            const view = editorAt(filled(), 2);
            expect(removeHeaderAction(0, 5)(view.state, view.dispatch)).toBe(false);
        });
    });

    describe('keyboard boundaries', () => {
        it('nextHeaderSlot: title to description', () => {
            const view = editorAt(filled(), 2);
            expect(nextHeaderSlot(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.selection.$from.parent.type.name).toBe('header_block_description');
        });

        it('nextHeaderSlot: description to the first action', () => {
            const pmDoc = filled();
            const view = editorAt(pmDoc, 9);
            expect(view.state.selection.$from.parent.type.name).toBe('header_block_description');
            expect(nextHeaderSlot(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.selection.$from.parent.type.name).toBe('header_block_action');
        });

        it('nextHeaderSlot: stays out of plain paragraphs', () => {
            const view = editorAt(doc(p('plain')), 2);
            expect(nextHeaderSlot(view.state, view.dispatch, view)).toBe(false);
        });

        it('exitHeaderForward: reuses the paragraph that already follows', () => {
            const view = editorAt(filled(), 2);
            expect(exitHeaderForward(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc.childCount).toBe(2);
            expect(view.state.selection.$from.parent).toMatchNode(p('after'));
        });

        it('exitHeaderForward: creates a paragraph when the header ends the document', () => {
            const view = editorAt(doc(header(title('T'), description(), actions())), 2);
            expect(exitHeaderForward(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc.childCount).toBe(2);
        });

        it('unwrapHeader: turns the block back into paragraphs, keeping the text', () => {
            const view = editorAt(filled(), 2);
            expect(unwrapHeader(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc.child(0)).toMatchNode(p('Title'));
            expect(view.state.doc.child(1)).toMatchNode(p('Description'));
        });

        it('unwrapHeader: only fires at the very start of the title', () => {
            const view = editorAt(filled(), 4);
            expect(unwrapHeader(view.state, view.dispatch, view)).toBe(false);
        });

        it('removeEmptyAction: deletes an empty button instead of merging it', () => {
            const pmDoc = doc(header(title('T'), description('S'), actions(action())));
            const actionPos = pmDoc.resolve(1).node().child(2).nodeSize;
            const view = editorAt(pmDoc, pmDoc.content.size - 3);
            expect(view.state.selection.$from.parent.type.name).toBe('header_block_action');
            expect(removeEmptyAction(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc.firstChild?.child(2).childCount).toBe(0);
            expect(actionPos).toBeGreaterThan(0);
        });

        it('removeEmptyAction: leaves a non-empty button alone', () => {
            const view = editorAt(filled(), 12);
            expect(removeEmptyAction(view.state, view.dispatch, view)).toBe(false);
        });
    });
});

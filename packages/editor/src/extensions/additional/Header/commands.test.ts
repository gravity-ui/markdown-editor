import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {HeaderActionType, HeaderBackground, HeaderFormat, getSchemaSpecs} from './HeaderSpecs';
import {
    addHeaderAction,
    exitHeaderForward,
    nextHeaderSlot,
    previousHeaderSlot,
    removeEmptyAction,
    removeHeaderAction,
    removeHeaderActionAt,
    setHeaderActionAttrs,
    setHeaderActionType,
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

        it('should edit the captured action after the cursor moves to another action', () => {
            const pmDoc = doc(
                header(
                    title('Title'),
                    description(),
                    actions(
                        action({href: '/first'}, '<first>First'),
                        action({href: '/second'}, '<second>Second'),
                    ),
                ),
            );
            const view = editorAt(pmDoc, pmDoc.tag.second);

            expect(
                setHeaderActionAttrs(pmDoc.tag.first - 1, {
                    href: '/updated',
                    type: HeaderActionType.Link,
                })(view.state, view.dispatch),
            ).toBe(true);

            expect(view.state.doc.firstChild?.child(2)).toMatchNode(
                actions(
                    action({href: '/updated', type: HeaderActionType.Link}, 'First'),
                    action({href: '/second'}, 'Second'),
                ),
            );
        });

        it('should preserve the URL when changing the selected action type', () => {
            const pmDoc = doc(
                header(title(), description(), actions(action({href: '/start'}, '<cursor>Go'))),
            );
            const view = editorAt(pmDoc, pmDoc.tag.cursor);

            expect(setHeaderActionType(HeaderActionType.Link)(view.state, view.dispatch)).toBe(
                true,
            );
            expect(view.state.doc.firstChild?.child(2).firstChild?.attrs).toMatchObject({
                href: '/start',
                type: HeaderActionType.Link,
            });
        });

        it('should ignore an unchanged URL and an invalid action position', () => {
            const pmDoc = doc(
                header(title(), description(), actions(action({href: '/start'}, '<cursor>Go'))),
            );
            const view = editorAt(pmDoc, pmDoc.tag.cursor);
            const dispatch = jest.fn();

            expect(
                setHeaderActionAttrs(pmDoc.tag.cursor - 1, {href: '/start'})(view.state, dispatch),
            ).toBe(false);
            expect(setHeaderActionAttrs(999, {href: '/new'})(view.state, dispatch)).toBe(false);
            expect(setHeaderActionAttrs(0, {href: '/new'})(view.state, dispatch)).toBe(false);
            expect(dispatch).not.toHaveBeenCalled();
        });

        it('should remove only the captured action and keep the other link', () => {
            const pmDoc = doc(
                header(
                    title(),
                    description('Description'),
                    actions(
                        action({href: '/first'}, '<first>First'),
                        action({href: '/second'}, '<second>Second'),
                    ),
                ),
            );
            const view = editorAt(pmDoc, pmDoc.tag.second);

            expect(removeHeaderActionAt(pmDoc.tag.first - 1)(view.state, view.dispatch)).toBe(true);
            expect(view.state.doc.firstChild?.child(2)).toMatchNode(
                actions(action({href: '/second'}, 'Second')),
            );
            expect(view.state.selection.$from.parent.textContent).toBe('Description');
            expect(removeHeaderActionAt(999)(view.state, view.dispatch)).toBe(false);
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

        it('nextHeaderSlot: visits both actions before leaving the header', () => {
            const pmDoc = doc(
                header(
                    title('<cursor>Title'),
                    description('Description'),
                    actions(action('First'), action('Second')),
                ),
                p('After'),
            );
            const view = editorAt(pmDoc, pmDoc.tag.cursor);

            for (const text of ['Description', 'First', 'Second', 'After']) {
                expect(nextHeaderSlot(view.state, view.dispatch)).toBe(true);
                expect(view.state.selection.$from.parent.textContent).toBe(text);
            }
            expect(view.state.doc).toMatchNode(pmDoc);
        });

        it('previousHeaderSlot: visits both actions, description and title in reverse', () => {
            const pmDoc = doc(
                header(
                    title('Title'),
                    description('Description'),
                    actions(action('First'), action('<cursor>Second')),
                ),
            );
            const view = editorAt(pmDoc, pmDoc.tag.cursor);

            for (const text of ['First', 'Description', 'Title']) {
                expect(previousHeaderSlot(view.state, view.dispatch)).toBe(true);
                expect(view.state.selection.$from.parent.textContent).toBe(text);
            }
            expect(previousHeaderSlot(view.state, view.dispatch)).toBe(false);
            expect(view.state.doc).toMatchNode(pmDoc);
        });

        it('nextHeaderSlot: exits after the description when there are no actions', () => {
            const pmDoc = doc(header(title('Title'), description('<cursor>Text'), actions()));
            const view = editorAt(pmDoc, pmDoc.tag.cursor);

            expect(nextHeaderSlot(view.state, view.dispatch)).toBe(true);
            expect(view.state.selection.$from.parent).toMatchNode(p());
            expect(view.state.doc.firstChild).toMatchNode(pmDoc.child(0));
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

        it('unwrapHeader: replaces an empty header with a paragraph', () => {
            const view = editorAt(doc(header(title(), description(), actions())), 2);
            expect(unwrapHeader(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc).toMatchNode(doc(p()));
            expect(view.state.selection.from).toBe(1);
        });

        it('unwrapHeader: preserves filled content, action URLs and styling', () => {
            const pmDoc = doc(
                header(
                    {fill: 'green'},
                    title('Title'),
                    description('Description'),
                    actions(action({href: '/start'}, 'Go')),
                ),
            );
            const view = editorAt(pmDoc, 2);
            const dispatch = jest.fn();

            expect(unwrapHeader(view.state, dispatch)).toBe(true);
            expect(dispatch).not.toHaveBeenCalled();
            expect(view.state.doc).toMatchNode(pmDoc);
        });

        it('unwrapHeader: preserves an image-only header', () => {
            const pmDoc = doc(
                header(
                    {bg: HeaderBackground.Image, image: '/cover.png'},
                    title(),
                    description(),
                    actions(),
                ),
            );
            const view = editorAt(pmDoc, 2);

            expect(unwrapHeader(view.state, view.dispatch)).toBe(true);
            expect(view.state.doc).toMatchNode(pmDoc);
        });

        it('unwrapHeader: preserves an action with a URL and no label', () => {
            const pmDoc = doc(header(title(), description(), actions(action({href: '/start'}))));
            const view = editorAt(pmDoc, 2);

            expect(unwrapHeader(view.state, view.dispatch)).toBe(true);
            expect(view.state.doc).toMatchNode(pmDoc);
        });

        it('unwrapHeader: only fires at the very start of the title', () => {
            const view = editorAt(filled(), 4);
            expect(unwrapHeader(view.state, view.dispatch, view)).toBe(false);
        });

        it('removeEmptyAction: deletes an empty button instead of merging it', () => {
            const pmDoc = doc(header(title('T'), description('S'), actions(action('<cursor>'))));
            const view = editorAt(pmDoc, pmDoc.tag.cursor);
            expect(view.state.selection.$from.parent.type.name).toBe('header_block_action');
            expect(removeEmptyAction(view.state, view.dispatch, view)).toBe(true);
            expect(view.state.doc.firstChild?.child(2).childCount).toBe(0);
            expect(view.state.selection.$from.parent).toMatchNode(description('S'));
        });

        it('removeEmptyAction: leaves a non-empty button alone', () => {
            const pmDoc = doc(header(title(), description(), actions(action('<cursor>Keep me'))));
            const view = editorAt(pmDoc, pmDoc.tag.cursor);
            expect(removeEmptyAction(view.state, view.dispatch, view)).toBe(false);
        });
    });
});

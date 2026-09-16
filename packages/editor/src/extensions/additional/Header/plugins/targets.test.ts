import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {getSchemaSpecs} from '../HeaderSpecs';
import {swapHeaderActions} from '../commands';

import {getHeaderTargets, headerTargetsPlugin, resolveHeaderTarget} from './targets';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*'},
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

function createState() {
    const document = doc(
        header(title('Title'), description(), actions(action('First'), action('Second'))),
        p('After'),
    );
    return EditorState.create({
        schema,
        doc: document,
        selection: TextSelection.create(document, 2),
        plugins: [headerTargetsPlugin()],
    });
}

describe('Header targets', () => {
    it('preserves identities and resolves current positions after edits before the targets', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        const paragraph = p('Before');
        state = state.apply(
            state.tr.insert(0, paragraph).insertText('More ', paragraph.nodeSize + 2),
        );
        const after = getHeaderTargets(state)!;

        expect(after.header).toEqual({id: before.header.id, pos: paragraph.nodeSize});
        expect(after.actions.map(({id}) => id)).toEqual(before.actions.map(({id}) => id));
        expect(after.actions[0].pos).toBe(before.actions[0].pos + paragraph.nodeSize + 5);
        expect(resolveHeaderTarget(state, before.actions[0].id)?.node.textContent).toBe('First');
    });

    it('preserves identities through header and action attribute changes', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        const firstAction = state.doc.nodeAt(before.actions[0].pos)!;
        state = state.apply(
            state.tr
                .setNodeMarkup(0, null, {...state.doc.firstChild!.attrs, format: 'small'})
                .setNodeMarkup(before.actions[0].pos, null, {
                    ...firstAction.attrs,
                    href: '/updated',
                }),
        );

        expect(getHeaderTargets(state)).toEqual(before);
        expect(resolveHeaderTarget(state, before.header.id)?.node.attrs.format).toBe('small');
        expect(resolveHeaderTarget(state, before.actions[0].id)?.node.attrs.href).toBe('/updated');
    });

    it('keeps each action identity through repeated swaps and subsequent edits', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        const dispatch = (tr: Parameters<typeof state.apply>[0]) => {
            state = state.apply(tr);
        };
        swapHeaderActions(0)(state, dispatch);
        expect(getHeaderTargets(state)?.actions.map(({id}) => id)).toEqual([
            before.actions[1].id,
            before.actions[0].id,
        ]);
        expect(resolveHeaderTarget(state, before.actions[0].id)?.node.textContent).toBe('First');
        expect(resolveHeaderTarget(state, before.actions[1].id)?.node.textContent).toBe('Second');
        const moved = resolveHeaderTarget(state, before.actions[0].id)!;
        dispatch(state.tr.setNodeMarkup(moved.pos, null, {...moved.node.attrs, href: '/moved'}));
        swapHeaderActions(0)(state, dispatch);
        expect(getHeaderTargets(state)).toEqual(before);
        expect(resolveHeaderTarget(state, before.actions[0].id)?.node.attrs.href).toBe('/moved');
    });

    it('keeps the second action identity when the first action is deleted', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        state = state.apply(state.tr.delete(before.actions[0].pos, before.actions[1].pos));

        expect(getHeaderTargets(state)?.actions).toEqual([
            {id: before.actions[1].id, pos: before.actions[0].pos},
        ]);
        expect(resolveHeaderTarget(state, before.actions[0].id)).toBeNull();
        expect(resolveHeaderTarget(state, before.actions[1].id)?.node.textContent).toBe('Second');
    });

    it('assigns a new identity to a replacement action at the same position', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        state = state.apply(
            state.tr.replaceWith(before.actions[0].pos, before.actions[1].pos, action('New')),
        );
        const after = getHeaderTargets(state)!;

        expect(after.header.id).toBe(before.header.id);
        expect(after.actions[0].id).not.toBe(before.actions[0].id);
        expect(after.actions[1].id).toBe(before.actions[1].id);
        expect(resolveHeaderTarget(state, before.actions[0].id)).toBeNull();
    });

    it('assigns new identities after a header is replaced at the same position', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        const tr = state.tr.replaceWith(
            0,
            state.doc.firstChild!.nodeSize,
            header(title('Replacement'), description(), actions(action('New'))),
        );
        state = state.apply(tr.setSelection(TextSelection.create(tr.doc, 2)));

        expect(getHeaderTargets(state)?.header.id).not.toBe(before.header.id);
        expect(resolveHeaderTarget(state, before.header.id)).toBeNull();
        expect(resolveHeaderTarget(state, before.actions[0].id)).toBeNull();
    });

    it('clears targets when selection leaves the header and creates a fresh session on return', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        state = state.apply(
            state.tr.setSelection(
                TextSelection.create(state.doc, state.doc.firstChild!.nodeSize + 1),
            ),
        );
        expect(getHeaderTargets(state)).toBeNull();
        expect(resolveHeaderTarget(state, before.header.id)).toBeNull();

        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2)));
        expect(getHeaderTargets(state)?.header.id).not.toBe(before.header.id);
        expect(resolveHeaderTarget(state, before.actions[0].id)).toBeNull();
    });

    it('does not transfer identities to another selected header', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        const pos = state.doc.content.size;
        const tr = state.tr.insert(pos, header(title('Other'), description(), actions()));
        state = state.apply(tr.setSelection(TextSelection.create(tr.doc, pos + 2)));

        expect(getHeaderTargets(state)?.header.id).not.toBe(before.header.id);
        expect(resolveHeaderTarget(state, before.header.id)).toBeNull();
    });

    it('clears targets when the selected header is deleted', () => {
        let state = createState();
        const before = getHeaderTargets(state)!;
        state = state.apply(state.tr.delete(0, state.doc.firstChild!.nodeSize));

        expect(getHeaderTargets(state)).toBeNull();
        expect(resolveHeaderTarget(state, before.header.id)).toBeNull();
        expect(resolveHeaderTarget(state, before.actions[1].id)).toBeNull();
    });
});

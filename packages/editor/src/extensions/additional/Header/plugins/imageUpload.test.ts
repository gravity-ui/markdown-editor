import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import type {FileUploadResult} from 'src/utils/upload';

import {getSchemaSpecs} from '../HeaderSpecs';

import {headerImageUploadPlugin, isHeaderImageUploading, uploadHeaderImage} from './imageUpload';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*', toDOM: () => ['p', 0]},
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
} = builders(schema);

const file = new File(['image'], 'cover.png', {type: 'image/png'});
const pickFile = async () => file;
const views: EditorView[] = [];

function createView() {
    const view = new EditorView(null, {
        state: EditorState.create({
            schema,
            doc: doc(
                header(title('First'), description(), actions()),
                p('Between'),
                header(title('Second'), description(), actions()),
            ),
            plugins: [headerImageUploadPlugin()],
        }),
    });
    views.push(view);
    return view;
}

async function beginUpload(view: EditorView, pos = 0) {
    let finish!: (result: FileUploadResult) => void;
    const result = new Promise<FileUploadResult>((resolve) => {
        finish = resolve;
    });
    const done = uploadHeaderImage(view, pos, () => result, pickFile);
    await Promise.resolve();
    return {done, finish};
}

afterEach(() => {
    for (const view of views.splice(0)) {
        if (!view.isDestroyed) view.destroy();
    }
});

describe('Header image upload', () => {
    it('updates the original header after edits and selection changes', async () => {
        const view = createView();
        const {done, finish} = await beginUpload(view);
        const before = p('Before');
        view.dispatch(view.state.tr.insert(0, before).insertText('!', before.nodeSize + 2));
        const otherPos = before.nodeSize + view.state.doc.child(1).nodeSize + p('Between').nodeSize;
        view.dispatch(
            view.state.tr.setSelection(TextSelection.create(view.state.doc, otherPos + 2)),
        );

        expect(isHeaderImageUploading(view.state, before.nodeSize)).toBe(true);
        finish({url: 'blob:https://example.test/upload'});
        await done;

        expect(view.state.doc.child(1).attrs).toMatchObject({
            bg: 'image',
            image: 'blob:https://example.test/upload',
        });
        expect(view.state.doc.child(3).attrs.image).toBe('');
        expect(view.state.selection.from).toBe(otherPos + 2);
        expect(isHeaderImageUploading(view.state, before.nodeSize)).toBe(false);
    });

    it('preserves format changes made during an upload', async () => {
        const view = createView();
        const {done, finish} = await beginUpload(view);
        view.dispatch(
            view.state.tr.setNodeMarkup(0, null, {
                ...view.state.doc.firstChild!.attrs,
                format: 'small',
            }),
        );

        expect(isHeaderImageUploading(view.state, 0)).toBe(true);
        finish({url: '/uploaded.png'});
        await done;
        expect(view.state.doc.firstChild!.attrs).toMatchObject({
            format: 'small',
            bg: 'image',
            image: '/uploaded.png',
        });
    });

    it('does not update another header after the target is deleted', async () => {
        const view = createView();
        const {done, finish} = await beginUpload(view);
        view.dispatch(view.state.tr.delete(0, view.state.doc.firstChild!.nodeSize));
        finish({url: '/uploaded.png'});
        await done;

        expect(view.state.doc.child(1).attrs.image).toBe('');
        expect(isHeaderImageUploading(view.state, 0)).toBe(false);
    });

    it('does not update a replacement header at the same position', async () => {
        const view = createView();
        const {done, finish} = await beginUpload(view);
        view.dispatch(
            view.state.tr.replaceWith(
                0,
                view.state.doc.firstChild!.nodeSize,
                header(title('Replacement'), description(), actions()),
            ),
        );
        finish({url: '/uploaded.png'});
        await done;

        expect(view.state.doc.firstChild!.attrs.image).toBe('');
        expect(isHeaderImageUploading(view.state, 0)).toBe(false);
    });

    it('stops applying changes after the editor is destroyed', async () => {
        const view = createView();
        const {done, finish} = await beginUpload(view);
        view.destroy();
        const dispatch = jest.spyOn(view, 'dispatch');
        finish({url: '/uploaded.png'});
        await done;

        expect(dispatch).not.toHaveBeenCalled();
    });

    it.each(['sync', 'async'])('clears progress after a %s upload error', async (kind) => {
        const view = createView();
        const error = new Error('Upload failed');
        const handler = () => {
            if (kind === 'sync') throw error;
            return Promise.reject(error);
        };

        await expect(uploadHeaderImage(view, 0, handler, pickFile)).rejects.toBe(error);
        expect(isHeaderImageUploading(view.state, 0)).toBe(false);
        expect(view.state.doc.firstChild!.attrs.image).toBe('');
    });

    it('clears progress when the file chooser is cancelled', async () => {
        const view = createView();
        const handler = jest.fn();
        await uploadHeaderImage(view, 0, handler, async () => undefined);

        expect(handler).not.toHaveBeenCalled();
        expect(isHeaderImageUploading(view.state, 0)).toBe(false);
    });

    it('prevents a second upload to the same header', async () => {
        const view = createView();
        const {done, finish} = await beginUpload(view);
        const pickAgain = jest.fn();
        await uploadHeaderImage(view, 0, jest.fn(), pickAgain);

        expect(pickAgain).not.toHaveBeenCalled();
        finish({url: '/uploaded.png'});
        await done;
    });
});

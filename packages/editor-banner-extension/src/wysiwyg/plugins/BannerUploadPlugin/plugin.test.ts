// @vitest-environment jsdom
import {Schema} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {bannerUploadPlugin, cancelBannerUploads, uploadBannerFile} from './plugin';

const scriptUrl = ['javascript', 'alert(1)'].join(':');

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {group: 'block', content: 'text*', toDOM: () => ['p', 0]},
        text: {},
        test_image: {
            group: 'block',
            atom: true,
            attrs: {src: {default: null}},
            toDOM: () => ['div'],
        },
    },
});

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
    vi.clearAllMocks();
});

// 0 p 1 "Text" 5 /p 6 image 7
function createView() {
    const doc = schema.node('doc', null, [
        schema.node('paragraph', null, schema.text('Text')),
        schema.node('test_image'),
    ]);
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({schema, doc, plugins: [bannerUploadPlugin()]}),
    });
    return view;
}

function deferred() {
    let resolve!: (url: string) => void;
    const promise = new Promise<{url: string}>((done) => {
        resolve = (url) => done({url});
    });
    return {handler: vi.fn(() => promise), resolve};
}

const setImage = vi.fn(
    (pos: number, src: string): Command =>
        (state, dispatch) => {
            dispatch?.(state.tr.setNodeAttribute(pos, 'src', src));
            return true;
        },
);

const file = new File(['a'], 'a.png', {type: 'image/png'});
const imageSrc = (editor: EditorView) => editor.state.doc.lastChild?.attrs.src;

describe('Banner upload plugin', () => {
    it('should write the address at the position of the moved node', async () => {
        const editor = createView();
        const {handler, resolve} = deferred();
        const upload = uploadBannerFile(editor, 6, file, handler, setImage);
        editor.dispatch(editor.state.tr.insert(0, schema.node('paragraph')));
        resolve('https://example.com/a.png');
        await expect(upload).resolves.toBe(true);
        expect(setImage).toHaveBeenLastCalledWith(8, 'https://example.com/a.png');
        expect(imageSrc(editor)).toBe('https://example.com/a.png');
    });

    it('should drop the upload when its node is removed', async () => {
        const editor = createView();
        const {handler, resolve} = deferred();
        const upload = uploadBannerFile(editor, 6, file, handler, setImage);
        editor.dispatch(editor.state.tr.delete(6, 7));
        await expect(upload).resolves.toBe(false);
        resolve('https://example.com/a.png');
        await Promise.resolve();
        expect(setImage).not.toHaveBeenCalled();
    });

    it('should drop the cancelled upload', async () => {
        const editor = createView();
        const {handler, resolve} = deferred();
        const upload = uploadBannerFile(editor, 6, file, handler, setImage);
        cancelBannerUploads(editor, 6);
        await expect(upload).resolves.toBe(false);
        resolve('https://example.com/a.png');
        await Promise.resolve();
        expect(imageSrc(editor)).toBeNull();
    });

    it('should write only the newer upload into the same node', async () => {
        const editor = createView();
        const first = deferred();
        const second = deferred();
        const older = uploadBannerFile(editor, 6, file, first.handler, setImage);
        const newer = uploadBannerFile(editor, 6, file, second.handler, setImage);
        await expect(older).resolves.toBe(false);
        second.resolve('https://example.com/new.png');
        first.resolve('https://example.com/old.png');
        await expect(newer).resolves.toBe(true);
        expect(imageSrc(editor)).toBe('https://example.com/new.png');
        expect(setImage).toHaveBeenCalledOnce();
    });

    it('should reject an unsafe address', async () => {
        const editor = createView();
        const {handler, resolve} = deferred();
        const upload = uploadBannerFile(editor, 6, file, handler, setImage);
        resolve(scriptUrl);
        await expect(upload).rejects.toThrow('Unsupported image address');
        expect(setImage).not.toHaveBeenCalled();
    });
});

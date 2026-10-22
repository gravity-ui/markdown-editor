import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../../core';
import {BaseSchemaSpecs} from '../../../base/specs';
import {HeaderSpecs} from '../HeaderSpecs';
import {setHeaderAttrs} from '../commands';

import {headerImageUploadPlugin, uploadHeaderImage} from './imageUpload';

const {schema, markupParser: parser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(HeaderSpecs, {}),
}).buildDeps();
const markup = ':::header\n\n:::header-title\nTitle\n:::\n\n:::';
const views: EditorView[] = [];
const createView = () => {
    const view = new EditorView(null, {
        state: EditorState.create({
            schema,
            doc: parser.parse(markup + '\n\n' + markup),
            plugins: [headerImageUploadPlugin()],
        }),
    });
    views.push(view);
    return view;
};
function chooseFile(file = new File(['image'], 'image.png', {type: 'image/png'})) {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
        this: HTMLInputElement,
    ) {
        Object.defineProperty(this, 'files', {value: [file]});
        this.dispatchEvent(new Event('change'));
    });
}
afterEach(() => {
    for (const view of views) if (!view.isDestroyed) view.destroy();
    views.length = 0;
    vi.restoreAllMocks();
});

describe('Header uploads', () => {
    it('should follow the original cover through document and attribute edits', async () => {
        chooseFile();
        const view = createView();
        let complete: (value: {url: string}) => void = () => {};
        const handler = vi.fn(
            () =>
                new Promise<{url: string}>((resolve) => {
                    complete = resolve;
                }),
        );
        const upload = uploadHeaderImage(view, 0, handler);
        await Promise.resolve();
        view.dispatch(
            view.state.tr.insert(0, schema.nodes.paragraph.create(null, schema.text('Before'))),
        );
        const pos = view.state.doc.firstChild!.nodeSize;
        setHeaderAttrs(pos, {'bg-image-theme': 'dark'})(view.state, view.dispatch);
        complete({url: '/uploaded.png'});
        expect(await upload).toBe('done');
        expect(view.state.doc.child(1).attrs).toMatchObject({
            image: '/uploaded.png',
            'bg-image-theme': 'dark',
        });
        expect(view.state.doc.child(2).attrs.image).toBe('');
    });
    it('should discard uploads when the original cover is deleted even if another cover takes its position', async () => {
        chooseFile();
        const view = createView();
        let complete: (value: {url: string}) => void = () => {};
        const upload = uploadHeaderImage(
            view,
            0,
            () =>
                new Promise((resolve) => {
                    complete = resolve;
                }),
        );
        await Promise.resolve();
        view.dispatch(view.state.tr.delete(0, view.state.doc.firstChild!.nodeSize));
        complete({url: '/uploaded.png'});
        expect(await upload).toBe('failed');
        expect(view.state.doc.firstChild?.attrs.image).toBe('');
    });
    it('should retain only the latest upload to the same image target', async () => {
        chooseFile();
        const view = createView();
        const complete: ((value: {url: string}) => void)[] = [];
        const handler = () =>
            new Promise<{url: string}>((resolve) => {
                complete.push(resolve);
            });
        const first = uploadHeaderImage(view, 0, handler);
        await Promise.resolve();
        const second = uploadHeaderImage(view, 0, handler);
        await Promise.resolve();
        complete[1]({url: '/new.png'});
        expect(await second).toBe('done');
        complete[0]({url: '/old.png'});
        expect(await first).toBe('failed');
        expect(view.state.doc.firstChild?.attrs.image).toBe('/new.png');
    });
    it('should reject oversized images before invoking the host handler', async () => {
        const file = new File(['image'], 'large.png', {type: 'image/png'});
        Object.defineProperty(file, 'size', {value: 2 * 1024 * 1024 + 1});
        chooseFile(file);
        const view = createView();
        const handler = vi.fn(async () => ({url: '/large.png'}));
        expect(await uploadHeaderImage(view, 0, handler)).toBe('failed');
        expect(handler).not.toHaveBeenCalled();
    });
    it('should keep background and content uploads independent', async () => {
        chooseFile();
        const view = createView();
        expect(await uploadHeaderImage(view, 0, async () => ({url: '/content.png'}), 'media')).toBe(
            'done',
        );
        expect(view.state.doc.firstChild?.attrs.image).toBe('');
        expect(view.state.doc.firstChild?.child(3).attrs.src).toBe('/content.png');
    });
    it('should ignore results after the editor is destroyed', async () => {
        chooseFile();
        const view = createView();
        let complete: (value: {url: string}) => void = () => {};
        const upload = uploadHeaderImage(
            view,
            0,
            () =>
                new Promise((resolve) => {
                    complete = resolve;
                }),
        );
        await Promise.resolve();
        view.destroy();
        complete({url: '/uploaded.png'});
        expect(await upload).toBe('cancelled');
    });
});

import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it, onTestFinished, vi} from 'vitest';

import {WidgetDescriptor} from '../WidgetDecoration';
import {WidgetDecorationPlugin} from '../WidgetDecoration/plugin';

import {FilesBatchUploadProcess} from './upload';

type UploadStage = 'skeleton' | 'upload' | 'node';

describe('FilesBatchUploadProcess', () => {
    it.each(['skeleton', 'upload', 'node'] as const)(
        'should skip view updates after destruction during the %s stage',
        async (stage) => {
            const {view, upload, paused, resume, uploadHandler, skeleton} = createUpload(stage);
            const running = upload.run();
            await paused;
            view.destroy();
            const dispatch = vi.spyOn(view, 'dispatch');
            onTestFinished(() => dispatch.mockRestore());

            resume();

            await expect(running).resolves.toBeUndefined();
            expect(dispatch).not.toHaveBeenCalled();
            expect(uploadHandler).toHaveBeenCalledTimes(stage === 'skeleton' ? 0 : 1);
            expect(skeleton.remove).toHaveBeenCalledOnce();
        },
    );

    it('should insert the uploaded content while the view is alive', async () => {
        const {view, upload, resume, skeleton} = createUpload('upload');
        resume();

        await upload.run();

        expect(view.state.doc.textContent).toBe(' uploaded ');
        expect(view.dom.querySelector('[data-upload-skeleton]')).toBeNull();
        expect(skeleton.remove).toHaveBeenCalledOnce();
    });
});

function createUpload(stage: UploadStage) {
    const schema = new Schema({
        nodes: {
            doc: {content: 'paragraph+'},
            paragraph: {content: 'text*', toDOM: () => ['p', 0]},
            text: {},
        },
    });
    const view = new EditorView(document.createElement('div'), {
        state: EditorState.create({schema, plugins: [WidgetDecorationPlugin()]}),
    });
    onTestFinished(() => view.destroy());
    const {promise: gate, resolve: resume} = Promise.withResolvers<void>();
    const {promise: paused, resolve: notifyPaused} = Promise.withResolvers<void>();
    async function pause(current: UploadStage) {
        if (current === stage) {
            notifyPaused();
            await gate;
        }
    }

    const skeleton = new Skeleton(1);
    class UploadProcess extends FilesBatchUploadProcess {
        protected async createSkeleton() {
            await pause('skeleton');
            return skeleton;
        }

        protected async createPMNode() {
            await pause('node');
            return schema.text('uploaded');
        }
    }

    const uploadHandler = vi.fn(async () => {
        await pause('upload');
        return {url: 'https://example.com/test.txt'};
    });
    const upload = new UploadProcess(view, [new File(['text'], 'test.txt')], uploadHandler);
    return {view, upload, paused, resume, uploadHandler, skeleton};
}

class Skeleton extends WidgetDescriptor {
    remove = vi.fn();

    protected renderWidget() {
        const element = document.createElement('span');
        element.setAttribute('data-upload-skeleton', '');
        return element;
    }
}

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
            const {view, process, paused, resume, uploadHandler} = createUpload(stage);
            const running = process.run();
            await paused;
            view.destroy();
            const dispatch = vi.spyOn(view, 'dispatch');
            onTestFinished(() => dispatch.mockRestore());

            resume();

            await expect(running).resolves.toBeUndefined();
            expect(dispatch).not.toHaveBeenCalled();
            expect(uploadHandler).toHaveBeenCalledTimes(stage === 'skeleton' ? 0 : 1);
        },
    );

    it('should insert the uploaded content while the view is alive', async () => {
        const {view, process, resume} = createUpload('upload');
        resume();

        await process.run();

        expect(view.state.doc.textContent).toBe(' uploaded ');
        expect(view.dom.querySelector('[data-upload-skeleton]')).toBeNull();
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
    let resume!: () => void;
    let notifyPaused!: () => void;
    const gate = new Promise<void>((resolve) => {
        resume = resolve;
    });
    const paused = new Promise<void>((resolve) => {
        notifyPaused = resolve;
    });
    async function pause(current: UploadStage) {
        if (current === stage) {
            notifyPaused();
            await gate;
        }
    }

    class UploadProcess extends FilesBatchUploadProcess {
        protected async createSkeleton() {
            await pause('skeleton');
            return new Skeleton(1);
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
    const process = new UploadProcess(view, [new File(['text'], 'test.txt')], uploadHandler);
    return {view, process, paused, resume, uploadHandler};
}

class Skeleton extends WidgetDescriptor {
    remove() {}

    protected renderWidget() {
        const element = document.createElement('span');
        element.setAttribute('data-upload-skeleton', '');
        return element;
    }
}

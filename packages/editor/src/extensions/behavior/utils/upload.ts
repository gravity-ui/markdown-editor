import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {getLoggerFromState} from 'src/core';
import type {Logger2} from 'src/logger';
import {type FileUploadHandler, type UploadSuccessItem, batchUploadFiles} from 'src/utils/upload';

import type {WidgetDescriptor} from '../WidgetDecoration';

export abstract class FilesBatchUploadProcess {
    protected readonly view;
    protected readonly files;
    protected readonly uploadHandler;
    protected readonly logger: Logger2.ILogger;

    protected skeletonDescriptor?: WidgetDescriptor;

    constructor(view: EditorView, files: readonly File[], uploadHandler: FileUploadHandler) {
        this.view = view;
        this.files = files;
        this.uploadHandler = uploadHandler;
        this.logger = getLoggerFromState(view.state);
    }

    async run() {
        await this.insertSkeleton();
        await this.batchUpload();
        this.removeSkeleton();
    }

    protected async insertSkeleton() {
        const {view} = this;
        const {state} = view;
        this.skeletonDescriptor = await this.createSkeleton();
        if (view.isDestroyed) return;
        let tr = state.tr;
        if (!state.selection.empty) tr = tr.deleteSelection();
        tr = this.skeletonDescriptor.applyTo(tr);
        view.dispatch(tr);
    }

    protected abstract createSkeleton(): WidgetDescriptor | Promise<WidgetDescriptor>;

    protected async batchUpload() {
        const insertQueue: Promise<void>[] = [];
        await batchUploadFiles(this.files, this.uploadHandler, (res) => {
            insertQueue.push(
                (async () => {
                    const node = await this.createPMNode(res);
                    const {view} = this;
                    if (view.isDestroyed) return;
                    const {schema} = view.state;
                    view.dispatch(
                        view.state.tr.insert(this.skeletonDescriptor!.pos, [
                            schema.text(' '),
                            node,
                            schema.text(' '),
                        ]),
                    );
                })().catch(console.error),
            );
        });
        await Promise.allSettled(insertQueue);
    }

    protected abstract createPMNode(res: UploadSuccessItem): Promise<Node>;

    protected removeSkeleton() {
        const {view} = this;
        if (view.isDestroyed) return;
        view.dispatch(this.skeletonDescriptor!.rmDeco(view.state.tr));
    }
}

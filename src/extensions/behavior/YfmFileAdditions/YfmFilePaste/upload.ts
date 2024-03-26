import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {fileType} from '../../../../extensions/yfm';
import {FileUploadHandler, UploadSuccessItem} from '../../../../utils/upload';
import {FilesBatchUploadProcess} from '../../utils/upload';
import {createFileNode} from '../utils';

import {FileSkeletonDescriptor} from './skeleton';

export abstract class YfmFilesUploadProcessBase extends FilesBatchUploadProcess {
    protected readonly createFile;

    constructor(view: EditorView, files: readonly File[], uploadHandler: FileUploadHandler) {
        super(view, files, uploadHandler);

        this.createFile = createFileNode(fileType(this.view.state.schema));
    }

    protected createSkeleton() {
        return new FileSkeletonDescriptor(this.getSkeletonInitPos());
    }

    protected abstract getSkeletonInitPos(): number;

    protected async createPMNode(res: UploadSuccessItem): Promise<Node> {
        return this.createFile(res);
    }
}

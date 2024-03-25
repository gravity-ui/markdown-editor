import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {imageType} from '../../../../extensions/markdown';
import {logger} from '../../../../logger';
import {FileUploadHandler, UploadSuccessItem} from '../../../../utils/upload';
import {FilesBatchUploadProcess} from '../../utils/upload';
import {IMG_MAX_HEIGHT} from '../const';
import {CreateImageNodeOptions, createImageNode, loadImage} from '../utils';

import {ImageSkeletonDescriptor} from './skeleton';

export class ImagesUploadProcess extends FilesBatchUploadProcess {
    protected readonly createImage;

    protected readonly initPosition: number;

    constructor(
        view: EditorView,
        files: readonly File[],
        uploadHandler: FileUploadHandler,
        position: number,
        opts: CreateImageNodeOptions,
    ) {
        super(view, files, uploadHandler);

        this.initPosition = position;
        this.createImage = createImageNode(imageType(this.view.state.schema), opts);
    }

    protected async createSkeleton() {
        return new ImageSkeletonDescriptor(this.initPosition, await getSkeletonSize(this.files));
    }

    protected async createPMNode(res: UploadSuccessItem): Promise<Node> {
        return this.createImage(res);
    }
}

async function getSkeletonSize(files: readonly File[]) {
    const skeletonSize = {width: '300', height: '200'};
    if (files.length === 1) {
        try {
            const size = await loadImage(files[0]).then(calcSkeletonSize);
            skeletonSize.width = String(size.width);
            skeletonSize.height = String(size.height);
        } catch (err) {
            logger.error(err);
        }
    }
    return skeletonSize;
}

function calcSkeletonSize(img: HTMLImageElement): {width: number; height: number} {
    const {width, height} = img;
    if (height <= IMG_MAX_HEIGHT) return {width, height};

    const ratio = IMG_MAX_HEIGHT / height; // ratio<1
    return {height: IMG_MAX_HEIGHT, width: width * ratio};
}

import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {logger} from '../../../../logger';
import {FileUploadHandler, UploadSuccessItem, getProportionalSize} from '../../../../utils';
import {FilesBatchUploadProcess} from '../../../behavior/utils/upload';
import {imageType} from '../../../markdown';
import {IMG_MAX_HEIGHT} from '../const';
import {CreateImageNodeOptions, createImageNode, loadImage} from '../utils';

import {ImageSkeletonDescriptor} from './skeleton';

export class ImagesUploadProcess extends FilesBatchUploadProcess {
    protected readonly createImage;

    protected readonly initPosition: number;
    private readonly enableNewImageSizeCalculation?: boolean;

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
        this.enableNewImageSizeCalculation = opts.enableNewImageSizeCalculation;
    }

    protected async createSkeleton() {
        return new ImageSkeletonDescriptor(
            this.initPosition,
            await getSkeletonSize(this.files, {
                enableNewImageSizeCalculation: this.enableNewImageSizeCalculation,
            }),
        );
    }

    protected async createPMNode(res: UploadSuccessItem): Promise<Node> {
        return this.createImage(res);
    }
}

async function getSkeletonSize(
    files: readonly File[],
    opts?: {enableNewImageSizeCalculation?: boolean},
) {
    const skeletonSize = {width: '300', height: '200'};
    if (files.length === 1) {
        try {
            const size = await loadImage(files[0]).then(
                opts?.enableNewImageSizeCalculation ? calcSkeletonSizeNew : calcSkeletonSize,
            );
            skeletonSize.width = String(size.width);
            skeletonSize.height = String(size.height);
        } catch (err) {
            logger.error(err);
        }
    }
    return skeletonSize;
}

function calcSkeletonSize({width, height}: HTMLImageElement): {width: number; height: number} {
    if (height <= IMG_MAX_HEIGHT) return {width, height};

    const ratio = IMG_MAX_HEIGHT / height; // ratio<1
    return {height: IMG_MAX_HEIGHT, width: width * ratio};
}

function calcSkeletonSizeNew({width, height}: HTMLImageElement): {width: number; height: number} {
    return getProportionalSize({
        width,
        height,
        imgMaxHeight: IMG_MAX_HEIGHT,
    });
}

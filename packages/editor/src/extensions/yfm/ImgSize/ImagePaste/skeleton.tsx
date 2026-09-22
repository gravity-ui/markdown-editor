import {
    ImageSkeleton,
    createImageSkeletonContainer,
} from '../../../../react-utils/components/ImageSkeleton';
import {ReactWidgetDescriptor} from '../../../behavior/WidgetDecoration';

export class ImageSkeletonDescriptor extends ReactWidgetDescriptor {
    #domElem;

    get pos() {
        return this.getPos?.() ?? this.initPos;
    }

    constructor(initPos: number, size?: {width: string; height: string}) {
        super(initPos, 'image_skeleton');

        this.#domElem = createImageSkeletonContainer(size);
    }

    getDomElem(): HTMLElement {
        return this.#domElem;
    }

    renderReactElement(): React.ReactElement {
        return <ImageSkeleton />;
    }
}

import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {ReactWidgetDescriptor} from '../../../behavior/WidgetDecoration';

import './skeleton.scss';

const b = cn('image-skeleton');

export class ImageSkeletonDescriptor extends ReactWidgetDescriptor {
    #domElem;

    get pos() {
        return this.getPos?.() ?? this.initPos;
    }

    constructor(initPos: number, size?: {width: string; height: string}) {
        super(initPos, 'image_skeleton');

        this.#domElem = document.createElement('span');
        this.#domElem.classList.add(b());
        if (size) {
            this.#domElem.style.setProperty('--img-skeleton-width', size.width);
            this.#domElem.style.setProperty('--img-skeleton-height', size.height);
        }
    }

    getDomElem(): HTMLElement {
        return this.#domElem;
    }

    renderReactElement(): React.ReactElement {
        return <Skeleton className={b('skeleton')} />;
    }
}

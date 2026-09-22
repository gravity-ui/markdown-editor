import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../../classname';

import './ImageSkeleton.scss';

const b = cn('image-skeleton');

export function createImageSkeletonContainer(size?: {width: string; height: string}) {
    const dom = document.createElement('span');
    dom.classList.add(b());
    if (size) {
        dom.style.setProperty('--img-skeleton-width', size.width);
        dom.style.setProperty('--img-skeleton-height', size.height);
    }
    return dom;
}

export function ImageSkeleton() {
    return <Skeleton className={b('skeleton')} />;
}

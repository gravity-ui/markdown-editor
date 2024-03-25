import React from 'react';

import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {ReactWidgetDescriptor} from '../../WidgetDecoration';

import './skeleton.scss';

const b = cn('file-skeleton');

export class FileSkeletonDescriptor extends ReactWidgetDescriptor {
    #domElem;

    constructor(initPos: number) {
        super(initPos, 'yfm_file_skeleton');

        this.#domElem = document.createElement('span');
        this.#domElem.classList.add(b(), 'yfm-file');
    }

    getDomElem(): HTMLElement {
        return this.#domElem;
    }

    renderReactElement(): React.ReactElement {
        return (
            <>
                <span className="yfm-file__icon" />
                <Skeleton className={b('skeleton')} />
            </>
        );
    }
}

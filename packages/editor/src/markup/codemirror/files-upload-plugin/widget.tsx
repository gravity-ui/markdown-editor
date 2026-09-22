import {Portal} from '@gravity-ui/uikit';

import {UploadLabel, type UploadLabelProps} from '../../../react-utils/components/UploadLabel';

import './widget.scss';

export {UploadLabel} from '../../../react-utils/components/UploadLabel';
export type {UploadedFile, UploadLabelProps} from '../../../react-utils/components/UploadLabel';

export function renderWidget(container: HTMLElement, props: UploadLabelProps) {
    return (
        <Portal container={container}>
            <UploadLabel {...props} />
        </Portal>
    );
}

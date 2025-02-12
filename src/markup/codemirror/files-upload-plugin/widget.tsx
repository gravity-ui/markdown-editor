import {ArrowsRotateRight} from '@gravity-ui/icons';
import {Icon, Label, Portal, Spin, Tooltip} from '@gravity-ui/uikit';

import {icons} from '../../../bundle/config/icons';
import {cn} from '../../../classname';

import './widget.scss';

export function renderWidget(container: HTMLElement, props: UploadLabelProps) {
    return (
        <Portal container={container}>
            <UploadLabel {...props} />
        </Portal>
    );
}

export type UploadedFile = {
    fileName: string;
    fileType: 'image' | 'file';
    status: 'uploading' | 'success' | 'error';
    errorText?: string;
};

const cnLabel = cn('upload-label');
export type UploadLabelProps = UploadedFile & {
    onReUploadClick: () => void;
};
export function UploadLabel({
    fileName,
    fileType,
    status,
    errorText,
    onReUploadClick,
}: UploadLabelProps) {
    const icon = fileType === 'image' ? icons.image : icons.file;

    if (status === 'uploading') {
        return (
            <Label size="xs" theme="info" icon={<Icon {...icon} />} className={cnLabel({status})}>
                <div className={cnLabel('content')}>
                    <span title={fileName} className={cnLabel('filename')}>
                        {fileName}
                    </span>
                    <Spin size="xs" />
                </div>
            </Label>
        );
    }

    if (status === 'success') {
        return (
            <Label
                size="xs"
                theme="success"
                icon={<Icon {...icon} />}
                className={cnLabel({status})}
            >
                <div className={cnLabel('content')}>
                    <span title={fileName} className={cnLabel('filename')}>
                        {fileName}
                    </span>
                </div>
            </Label>
        );
    }

    if (status === 'error') {
        return (
            <Tooltip content={errorText}>
                <Label
                    size="xs"
                    interactive
                    theme="danger"
                    icon={<Icon {...icon} />}
                    onClick={onReUploadClick}
                    className={cnLabel({status})}
                >
                    <div className={cnLabel('content')}>
                        <span className={cnLabel('filename')}>{fileName}</span>
                        <Icon data={ArrowsRotateRight} size={16} />
                    </div>
                </Label>
            </Tooltip>
        );
    }

    return null;
}

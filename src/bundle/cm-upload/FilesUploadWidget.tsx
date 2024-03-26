import React from 'react';

import {ArrowsRotateRight, Xmark} from '@gravity-ui/icons';
import {Button, Icon, Label, Spin, Tooltip} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';

import {cn} from '../../classname';
import {icons} from '../config/icons';

import './FilesUploadWidget.scss';

export type UploadedFile = {
    fileName: string;
    fileType: 'image' | 'file';
    status: 'uploading' | 'success' | 'error';
    errorText?: string;
};

export function renderUploadWidget(container: HTMLElement, props: UploadWidgetProps) {
    return () => createPortal(<UploadWidget {...props} />, container);
}

const cnWidget = cn('upload-widget');
type UploadWidgetProps = {
    files: readonly UploadedFile[];
    onReUploadClick: (file: UploadedFile) => void;
    onCloseClick: () => void;
};
function UploadWidget({files, onReUploadClick, onCloseClick}: UploadWidgetProps) {
    if (!files.length) return null;

    const showCloseButton = files.every((f) => f.status === 'error');

    return (
        <div className={cnWidget()}>
            <div className={cnWidget('labels')}>
                Uploading files:
                {files.map((file) => (
                    <UploadLabel
                        {...file}
                        key={file.fileName}
                        onReUploadClick={() => onReUploadClick(file)}
                    />
                ))}
            </div>
            {showCloseButton && (
                <Button
                    size="xs"
                    view="flat-secondary"
                    onClick={onCloseClick}
                    className={cnWidget('close-button')}
                >
                    <Icon data={Xmark} />
                </Button>
            )}
        </div>
    );
}

const cnLabel = cn('upload-label');
type UploadLabelProps = UploadedFile & {
    onReUploadClick: () => void;
};
function UploadLabel({fileName, fileType, status, errorText, onReUploadClick}: UploadLabelProps) {
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

import React, {RefObject, useCallback} from 'react';

import {Popup, PopupPlacement} from '@gravity-ui/uikit';

import {ImageForm, ImageFormProps} from '../../../forms/ImageForm';
import {i18n} from '../../../i18n/forms';
import {useBooleanState} from '../../../react-utils/hooks';
import {useToaster} from '../../../react-utils/toaster';
import type {ToolbarBaseProps} from '../../../toolbar';
import {BatchUploadResult, FileUploadHandler, batchUploadFiles} from '../../../utils/upload';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarImagePopuProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    uploadImages?: FileUploadHandler;
    onSuccessUpload?: (res: BatchUploadResult) => void;
    hide: () => void;
    anchorRef: RefObject<HTMLElement>;
} & Pick<ImageFormProps, 'onSubmit'>;

export const ToolbarImagePopup: React.FC<ToolbarImagePopuProps> = ({
    className,
    anchorRef,
    hide,
    onSubmit,
    focus,
    onClick,
    uploadImages,
    onSuccessUpload,
}) => {
    const toaster = useToaster();
    const [loading, showLoading, hideLoading] = useBooleanState(false);

    const handleCancel = useCallback(() => {
        hide();
        focus();
    }, [focus, hide]);

    return (
        <Popup
            open
            anchorRef={anchorRef}
            onClose={handleCancel}
            placement={placement}
            className={className}
        >
            <ImageForm
                autoFocus
                onAttach={
                    uploadImages &&
                    ((files) => {
                        showLoading();
                        batchUploadFiles(files, uploadImages).then(
                            (res) => {
                                hideLoading();
                                hide();
                                onSuccessUpload?.(res);
                            },
                            (err) => {
                                hideLoading();
                                toaster.add({
                                    theme: 'danger',
                                    name: 'toolbar_image_upload',
                                    title: i18n('image_upload_failed'),
                                    content: String(err),
                                });
                            },
                        );
                    })
                }
                onCancel={handleCancel}
                onSubmit={(data) => {
                    hide();
                    focus();
                    onSubmit(data);
                    onClick?.('addImage');
                }}
                loading={loading}
            />
        </Popup>
    );
};

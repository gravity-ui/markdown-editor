import {useCallback} from 'react';

import {Popup, type PopupPlacement, useToaster} from '@gravity-ui/uikit';

import {ImageForm, type ImageFormProps} from '../../../forms/ImageForm';
import {i18n} from '../../../i18n/forms';
import {useBooleanState} from '../../../react-utils/hooks';
import type {ToolbarBaseProps} from '../../../toolbar';
import {
    type BatchUploadResult,
    type FileUploadHandler,
    batchUploadFiles,
} from '../../../utils/upload';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarImagePopuProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    uploadImages?: FileUploadHandler;
    onSuccessUpload?: (res: BatchUploadResult) => void;
    hide: () => void;
    anchorElement: HTMLElement | null;
} & Pick<ImageFormProps, 'onSubmit' | 'imageTitle'>;

export const ToolbarImagePopup: React.FC<ToolbarImagePopuProps> = ({
    className,
    anchorElement,
    hide,
    onSubmit,
    focus,
    onClick,
    uploadImages,
    onSuccessUpload,
    imageTitle,
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
            anchorElement={anchorElement}
            onOpenChange={handleCancel}
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
                imageTitle={imageTitle}
            />
        </Popup>
    );
};

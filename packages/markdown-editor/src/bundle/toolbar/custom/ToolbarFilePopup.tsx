import {useCallback} from 'react';

import {Popup, type PopupPlacement, useToaster} from '@gravity-ui/uikit';

import {FileForm, type FileFormProps} from '../../../forms/FileForm';
import {i18n} from '../../../i18n/forms';
import {useBooleanState} from '../../../react-utils/hooks';
import type {ToolbarBaseProps} from '../../../toolbar';
import {
    type BatchUploadResult,
    type FileUploadHandler,
    batchUploadFiles,
} from '../../../utils/upload';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarFilePopupProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    hide: () => void;
    anchorElement: HTMLElement | null;

    uploadHandler?: FileUploadHandler;
    onSuccessUpload?: (result: BatchUploadResult) => void;
} & Pick<FileFormProps, 'onSubmit' | 'uploadHint'>;

export const ToolbarFilePopup: React.FC<ToolbarFilePopupProps> = ({
    className,
    hide,
    anchorElement,

    onSubmit,
    focus,
    onClick,
    uploadHandler,
    onSuccessUpload,
    uploadHint,
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
            modal
            onOpenChange={handleCancel}
            anchorElement={anchorElement}
            placement={placement}
            className={className}
        >
            <FileForm
                autoFocus
                onAttach={
                    uploadHandler &&
                    ((files) => {
                        showLoading();
                        batchUploadFiles(files, uploadHandler).then(
                            (res) => {
                                hideLoading();
                                hide();
                                onSuccessUpload?.(res);
                            },
                            (error) => {
                                hideLoading();
                                toaster.add({
                                    theme: 'danger',
                                    name: 'toolbar_file_upload',
                                    title: i18n('file_upload_failed'),
                                    content: String(error),
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
                    onClick?.('addFile');
                }}
                loading={loading}
                uploadHint={uploadHint}
            />
        </Popup>
    );
};

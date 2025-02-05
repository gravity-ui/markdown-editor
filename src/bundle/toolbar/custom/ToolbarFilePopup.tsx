import {RefObject, useCallback} from 'react';

import {Popup, PopupPlacement} from '@gravity-ui/uikit';

import {FileForm, FileFormProps} from '../../../forms/FileForm';
import {i18n} from '../../../i18n/forms';
import {useBooleanState} from '../../../react-utils/hooks';
import {useToaster} from '../../../react-utils/toaster';
import type {ToolbarBaseProps} from '../../../toolbar';
import {BatchUploadResult, FileUploadHandler, batchUploadFiles} from '../../../utils/upload';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarFilePopupProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    hide: () => void;
    anchorRef: RefObject<HTMLElement>;

    uploadHandler?: FileUploadHandler;
    onSuccessUpload?: (result: BatchUploadResult) => void;
} & Pick<FileFormProps, 'onSubmit'>;

export const ToolbarFilePopup: React.FC<ToolbarFilePopupProps> = ({
    className,
    hide,
    anchorRef,

    onSubmit,
    focus,
    onClick,
    uploadHandler,
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
            onClose={handleCancel}
            anchorRef={anchorRef}
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
            />
        </Popup>
    );
};

import React from 'react';

import {Button, Icon, Popup, PopupPlacement, Tooltip} from '@gravity-ui/uikit';

import {FileForm, FileFormProps} from '../../../forms/FileForm';
import {i18n} from '../../../i18n/forms';
import {i18n as i18nToolbar} from '../../../i18n/menubar';
import {useBooleanState} from '../../../react-utils/hooks';
import {useToaster} from '../../../react-utils/toaster';
import {ToolbarBaseProps, ToolbarTooltipDelay} from '../../../toolbar';
import {BatchUploadResult, FileUploadHandler, batchUploadFiles} from '../../../utils/upload';
import {icons} from '../../config/icons';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarFileProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    active: boolean;
    enable: boolean;
    uploadHandler?: FileUploadHandler;
    onSuccessUpload?: (result: BatchUploadResult) => void;
} & Pick<FileFormProps, 'onSubmit'>;

export const ToolbarFile: React.FC<ToolbarFileProps> = ({
    className,
    active,
    enable,
    onSubmit,
    focus,
    onClick,
    uploadHandler,
    onSuccessUpload,
}) => {
    const toaster = useToaster();
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [open, , hide, toggleOpen] = useBooleanState(false);
    const [loading, showLoading, hideLoading] = useBooleanState(false);

    const popupOpen = enable && open;
    const shouldForceHide = open && !popupOpen;
    React.useLayoutEffect(() => {
        if (shouldForceHide) {
            hide();
        }
    }, [hide, shouldForceHide]);

    return (
        <>
            <Tooltip
                disabled={popupOpen}
                content={i18nToolbar('file')}
                openDelay={ToolbarTooltipDelay.Open}
                closeDelay={ToolbarTooltipDelay.Close}
            >
                <Button
                    size="m"
                    ref={buttonRef}
                    view={active || popupOpen ? 'normal' : 'flat'}
                    selected={active}
                    disabled={!enable}
                    className={className}
                    onClick={toggleOpen}
                >
                    <Icon data={icons.file.data} size={icons.file.size ?? 16} />
                </Button>
            </Tooltip>
            <Popup anchorRef={buttonRef} open={popupOpen} onClose={hide} placement={placement}>
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
                    onCancel={hide}
                    onSubmit={(data) => {
                        hide();
                        focus();
                        onSubmit(data);
                        onClick?.('addFile');
                    }}
                    loading={loading}
                />
            </Popup>
        </>
    );
};

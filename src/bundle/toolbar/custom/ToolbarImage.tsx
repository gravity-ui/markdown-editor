import React from 'react';

import {ActionTooltip, Button, Icon, Popup, PopupPlacement} from '@gravity-ui/uikit';

import {ImageForm, ImageFormProps} from '../../../forms/ImageForm';
import {i18n} from '../../../i18n/forms';
import {i18n as i18nToolbar} from '../../../i18n/menubar';
import {useBooleanState} from '../../../react-utils/hooks';
import {useToaster} from '../../../react-utils/toaster';
import {ToolbarBaseProps, ToolbarTooltipDelay} from '../../../toolbar';
import {BatchUploadResult, FileUploadHandler, batchUploadFiles} from '../../../utils/upload';
import {icons} from '../../config/icons';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarImageProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    active: boolean;
    enable: boolean;
    uploadImages?: FileUploadHandler;
    onSuccessUpload?: (res: BatchUploadResult) => void;
} & Pick<ImageFormProps, 'onSubmit'>;

export const ToolbarImage: React.FC<ToolbarImageProps> = ({
    className,
    active,
    enable,
    onSubmit,
    focus,
    onClick,
    uploadImages,
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
            <ActionTooltip
                disabled={popupOpen}
                title={i18nToolbar('image')}
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
                    <Icon data={icons.image.data} size={icons.image.size ?? 16} />
                </Button>
            </ActionTooltip>
            <Popup anchorRef={buttonRef} open={popupOpen} onClose={hide} placement={placement}>
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
                    onCancel={hide}
                    onSubmit={(data) => {
                        hide();
                        focus();
                        onSubmit(data);
                        onClick?.('addImage');
                    }}
                    loading={loading}
                />
            </Popup>
        </>
    );
};

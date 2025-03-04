import {useCallback} from 'react';

import {Picture as ImageIcon} from '@gravity-ui/icons';
import {Icon, Popup, type PopupPlacement} from '@gravity-ui/uikit';
import {useMountedState} from 'react-use';

import {cn} from '../../../../classname';
import {
    ImageForm,
    type ImageFormProps,
    type ImageFormSubmitParams,
} from '../../../../forms/ImageForm';
import {i18n} from '../../../../i18n/widgets';
import {useBooleanState, useElementState} from '../../../../react-utils/hooks';

import './view.scss';

const b = cn('image-placeholder');
const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type RenderImageWidgetFormProps = {
    /** Handler for submitting form */
    onSubmit: (params: ImageFormSubmitParams) => void;
    /** Handler for cancellation */
    onCancel: () => void;
    /** Handler for attach file from device */
    onAttach?: (files: File[]) => void;
    /** Uploading attached file */
    uploading?: boolean;
};
export type RenderImageWidgetFormFn = (props: RenderImageWidgetFormProps) => React.ReactNode;

const defaultFormRenderer: RenderImageWidgetFormFn = (props) => {
    return (
        <ImageForm
            autoFocus
            loading={props.uploading}
            onCancel={props.onCancel}
            onSubmit={props.onSubmit}
            onAttach={props.onAttach}
        />
    );
};

export type ImagePlaceholderProps = {
    onCancel: () => void;
    onSubmit: ImageFormProps['onSubmit'];
    onAttach?: (files: File[]) => Promise<void>;
    renderForm?: RenderImageWidgetFormFn;
};

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
    onCancel,
    onSubmit,
    onAttach,
    renderForm,
}) => {
    const isMounted = useMountedState();
    const [uploading, startUploading, stopUploading] = useBooleanState(false);
    const [anchor, setAnchor] = useElementState();
    const attachHandler = useCallback<NonNullable<ImageFormProps['onAttach']>>(
        (files) => {
            if (!onAttach) return;
            if (isMounted()) {
                startUploading();
                onAttach(files).finally(() => {
                    if (isMounted()) {
                        stopUploading();
                    }
                });
            }
        },
        [isMounted, onAttach, startUploading, stopUploading],
    );

    return (
        <>
            <div ref={setAnchor} className={b()}>
                <Icon data={ImageIcon} size={24} />
                {i18n('image')}
            </div>
            <Popup open modal onOpenChange={onCancel} anchorElement={anchor} placement={placement}>
                {(renderForm || defaultFormRenderer)({
                    onCancel,
                    onSubmit,
                    uploading,
                    onAttach: onAttach && attachHandler,
                })}
            </Popup>
        </>
    );
};

import {useCallback} from 'react';

import {Picture as ImageIcon} from '@gravity-ui/icons';
import {Icon, Popup, type PopupPlacement} from '@gravity-ui/uikit';
import {useMountedState} from 'react-use';

import {cn} from '../../../../classname';
import {ImageForm, type ImageFormProps} from '../../../../forms/ImageForm';
import {i18n} from '../../../../i18n/widgets';
import {useBooleanState, useElementState} from '../../../../react-utils/hooks';

import './view.scss';

const b = cn('image-placeholder');
const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type FilePlaceholderProps = {
    onCancel: () => void;
    onSubmit: ImageFormProps['onSubmit'];
    onAttach?: (files: File[]) => Promise<void>;
};

export const FilePlaceholder: React.FC<FilePlaceholderProps> = ({onCancel, onSubmit, onAttach}) => {
    const isMounted = useMountedState();
    const [loading, showLoading, hideLoading] = useBooleanState(false);
    const [anchor, setAnchor] = useElementState();
    const attachHandler = useCallback<NonNullable<ImageFormProps['onAttach']>>(
        (files) => {
            if (!onAttach) return;
            if (isMounted()) {
                showLoading();
                onAttach(files).finally(() => {
                    if (isMounted()) {
                        hideLoading();
                    }
                });
            }
        },
        [isMounted, onAttach, showLoading, hideLoading],
    );

    return (
        <>
            <div ref={setAnchor} className={b()}>
                <Icon data={ImageIcon} size={24} />
                {i18n('image')}
            </div>
            <Popup open modal onOpenChange={onCancel} anchorElement={anchor} placement={placement}>
                <ImageForm
                    autoFocus
                    loading={loading}
                    onCancel={onCancel}
                    onSubmit={onSubmit}
                    onAttach={onAttach && attachHandler}
                />
            </Popup>
        </>
    );
};

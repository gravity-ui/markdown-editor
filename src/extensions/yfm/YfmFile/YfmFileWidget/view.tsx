import {useCallback} from 'react';

import {Popup, type PopupPlacement} from '@gravity-ui/uikit';
import {useMountedState} from 'react-use';

import {cn} from '../../../../classname';
import {FileForm, type FileFormProps} from '../../../../forms/FileForm';
import {i18n} from '../../../../i18n/widgets';
import {useBooleanState, useElementState} from '../../../../react-utils/hooks';

import './view.scss';

const b = cn('file-placeholder');
const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type FilePlaceholderProps = {
    onCancel: () => void;
    onSubmit: FileFormProps['onSubmit'];
    onAttach?: (files: File[]) => Promise<void>;
};

export const FilePlaceholder: React.FC<FilePlaceholderProps> = ({onCancel, onSubmit, onAttach}) => {
    const isMounted = useMountedState();
    const [loading, showLoading, hideLoading] = useBooleanState(false);
    const [anchor, setAnchor] = useElementState();
    const attachHandler = useCallback<NonNullable<FileFormProps['onAttach']>>(
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
            <span ref={setAnchor} className={b()}>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a href="#" className="yfm-file">
                    <span className="yfm-file__icon" />
                    {i18n('file')}
                </a>
            </span>
            <Popup open modal onOpenChange={onCancel} anchorElement={anchor} placement={placement}>
                <FileForm
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

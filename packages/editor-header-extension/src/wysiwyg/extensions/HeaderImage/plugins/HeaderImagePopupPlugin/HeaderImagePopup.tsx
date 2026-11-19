import {useEffect, useMemo, useRef} from 'react';

import {Button} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import type {HeaderUploadLimits} from '../../../../plugins/HeaderUploadPlugin';
import {nodeAnchor} from '../../../popup';
import {ImageSource, SettingsDialog, cnHeaderSettings} from '../../../settings';

export type HeaderImagePopupProps = {
    anchor: HTMLElement;
    src: string | null;
    limits: HeaderUploadLimits;
    /** Without it, the image is set by a link only. Resolves to `false` when the image no longer takes the result. */
    upload?: (file: File) => Promise<boolean>;
    cancelUpload: () => void;
    onLink: (src: string) => void;
    onReset: () => void;
    onClose: (reason?: string) => void;
};

export function HeaderImagePopup({
    anchor,
    src,
    limits,
    upload,
    cancelUpload,
    onLink,
    onReset,
    onClose,
}: HeaderImagePopupProps) {
    const anchorElement = useMemo(() => nodeAnchor(anchor), [anchor]);
    const firstField = useRef<HTMLElement>(null);
    const resetting = useRef(false);
    // Reset removes the focused button with the file: the focus goes to the form.
    useEffect(() => {
        if (src || !resetting.current) return;
        resetting.current = false;
        firstField.current?.focus();
    }, [src]);
    const reset = () => {
        resetting.current = true;
        onReset();
    };
    return (
        <SettingsDialog
            title={i18n('image')}
            className={cnHeaderSettings('popup')}
            qa="header-image"
            closeSize="m"
            closeAnchor={anchor}
            onClose={onClose}
            anchorElement={anchorElement}
            placement={['bottom-start', 'top-start']}
            initialFocus={firstField}
            returnFocus={false}
        >
            <ImageSource
                image={src}
                limits={limits}
                firstFieldRef={firstField}
                upload={upload}
                cancelUpload={cancelUpload}
                onLink={onLink}
                onClose={onClose}
            >
                {(file) => (
                    <>
                        {file}
                        <Button view="outlined" size="m" onClick={reset}>
                            {i18n('image-reset')}
                        </Button>
                    </>
                )}
            </ImageSource>
        </SettingsDialog>
    );
}

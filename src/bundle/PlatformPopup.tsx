import type {FC, ReactNode} from 'react';

import {Popup, type PopupProps, Sheet} from '@gravity-ui/uikit';

import {cn} from '../classname';

export type PlatformPopupProps = Pick<PopupProps, 'placement' | 'open' | 'anchorElement'> & {
    children: ReactNode;
    mobile?: boolean;
    onClose?: () => void;
};

import './PlatformPopup.scss';

const b = cn('platform-popup');

export const PlatformPopup: FC<PlatformPopupProps> = ({
    mobile,
    children,
    onClose,
    anchorElement,
    placement,
    open = false,
}) => {
    if (mobile) {
        return (
            <Sheet visible={open} onClose={onClose} className={b('sheet')}>
                {children}
            </Sheet>
        );
    }

    return (
        <Popup
            anchorElement={anchorElement}
            open={open}
            onOpenChange={onClose}
            placement={placement}
        >
            {children}
        </Popup>
    );
};

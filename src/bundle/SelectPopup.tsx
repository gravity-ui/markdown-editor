import React from 'react';

import {Popup, PopupProps, Sheet} from '@gravity-ui/uikit';

import {cn} from '../classname';

export type SelectPopupProps = Pick<PopupProps, 'placement' | 'open' | 'anchorRef'> & {
    children: React.ReactNode;
    mobile?: boolean;
    buttonRef?: PopupProps['anchorRef'];
    onClose?: () => void;
};

import './SelectPopup.scss';

const b = cn('select-popup');

export const SelectPopup: React.FC<SelectPopupProps> = ({
    mobile,
    children,
    onClose,
    anchorRef,
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
        <Popup anchorRef={anchorRef} open={open} onClose={onClose} placement={placement}>
            {children}
        </Popup>
    );
};

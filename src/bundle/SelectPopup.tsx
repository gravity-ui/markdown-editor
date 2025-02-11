import {FC, ReactNode} from 'react';

import {Popup, PopupProps, Sheet} from '@gravity-ui/uikit';

import {cn} from '../classname';

export type SelectPopupProps = Pick<PopupProps, 'placement' | 'open' | 'anchorElement'> & {
    children: ReactNode;
    mobile?: boolean;
    onClose?: () => void;
};

import './SelectPopup.scss';

const b = cn('select-popup');

export const SelectPopup: FC<SelectPopupProps> = ({
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

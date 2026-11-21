import type {KeyboardEvent, ReactNode} from 'react';

import {closeOnTabOut} from './popup';

type TabOutCloseProps = {
    onClose: (reason?: string) => void;
    children: ReactNode;
};

export function TabOutClose({onClose, children}: TabOutCloseProps) {
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => closeOnTabOut(event, onClose);
    return (
        <div role="presentation" onKeyDown={onKeyDown}>
            {children}
        </div>
    );
}

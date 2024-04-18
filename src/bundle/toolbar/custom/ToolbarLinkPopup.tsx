import React, {RefObject, useCallback} from 'react';

import {Popup, PopupPlacement} from '@gravity-ui/uikit';

import {LinkForm, LinkFormSubmitParams} from '../../../forms/LinkForm';
import type {ToolbarBaseProps} from '../../../toolbar';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarLinkPopupProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    onSubmit(url: string, text: string): void;
    formInitialText?: string;
    formReadOnlyText?: boolean;
    hide: () => void;
    anchorRef: RefObject<HTMLElement>;
};

export const ToolbarLinkPopup: React.FC<ToolbarLinkPopupProps> = ({
    className,
    focus,
    onClick,

    anchorRef,
    formInitialText,
    formReadOnlyText,
    onSubmit,
    hide,
}) => {
    const handleCancel = useCallback(() => {
        hide();
        focus();
    }, [focus, hide]);

    const handleSubmit = useCallback(
        ({url, text}: LinkFormSubmitParams) => {
            hide();
            focus();
            onSubmit(url, text);
            onClick?.('addLink');
        },
        [focus, hide, onClick, onSubmit],
    );

    return (
        <Popup
            open
            anchorRef={anchorRef}
            onClose={handleCancel}
            placement={placement}
            className={className}
        >
            <LinkForm
                autoFocus
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                initialText={formInitialText}
                readOnlyText={formReadOnlyText}
            />
        </Popup>
    );
};

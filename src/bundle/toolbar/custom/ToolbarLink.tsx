import React from 'react';

import {Button, Icon, Popup, PopupPlacement, Tooltip} from '@gravity-ui/uikit';

import {LinkForm, LinkFormSubmitParams} from '../../../forms/LinkForm';
import {i18n} from '../../../i18n/menubar';
import {useBooleanState} from '../../../react-utils/hooks';
import {ToolbarBaseProps, ToolbarTooltipDelay} from '../../../toolbar';
import {icons} from '../../config/icons';

const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type ToolbarLinkProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    active: boolean;
    enable: boolean;
    onSubmit(url: string, text: string): void;
    removeLink(): void;
    formInitialText?: string;
    formReadOnlyText?: boolean;
};

export const ToolbarLink: React.FC<ToolbarLinkProps> = ({
    className,
    focus,
    onClick,

    active,
    enable,
    formInitialText,
    formReadOnlyText,
    onSubmit,
    removeLink,
}) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [open, , hide, toggleOpen] = useBooleanState(false);

    const popupOpen = enable && open;
    const shouldForceHide = open && !popupOpen;
    React.useLayoutEffect(() => {
        if (shouldForceHide) {
            hide();
        }
    }, [hide, shouldForceHide]);

    const handleClick = () => {
        if (active) {
            focus();
            removeLink();
            if (popupOpen) {
                hide();
            }
            return;
        }

        toggleOpen();
    };

    const handleSubmit = React.useCallback(
        ({url, text}: LinkFormSubmitParams) => {
            hide();
            focus();
            onSubmit(url, text);
            onClick?.('addLink');
        },
        [focus, hide, onClick, onSubmit],
    );

    return (
        <>
            <Tooltip
                disabled={popupOpen}
                content={i18n('link')}
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
                    onClick={handleClick}
                >
                    <Icon data={icons.link.data} size={icons.link.size ?? 16} />
                </Button>
            </Tooltip>
            <Popup anchorRef={buttonRef} open={popupOpen} onClose={hide} placement={placement}>
                <LinkForm
                    autoFocus
                    onCancel={hide}
                    onSubmit={handleSubmit}
                    initialText={formInitialText}
                    readOnlyText={formReadOnlyText}
                />
            </Popup>
        </>
    );
};

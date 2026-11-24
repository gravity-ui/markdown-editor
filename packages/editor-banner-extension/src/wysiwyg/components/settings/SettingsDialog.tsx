import type {CSSProperties, KeyboardEvent, ReactNode} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popup, type PopupProps, Text, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {type CloseAnchor, closeOnTabOut, closeUnlessAnchor} from '../../utils/popup';

import {cnBannerSettings} from './classname';

import './SettingsDialog.scss';

const CLOSE_ICON_SIZE = 16;
// With `left: 0` from Popup, `right` caps the window at the viewport width minus 32 px.
const FLOATING_STYLES: CSSProperties = {width: 'fit-content', right: 'var(--g-spacing-8)'};

type SettingsDialogProps = Pick<
    PopupProps,
    'anchorElement' | 'placement' | 'floatingMiddlewares' | 'initialFocus' | 'returnFocus'
> & {
    title: string;
    className: string;
    qa: string;
    closeSize: 'm' | 'l';
    closeAnchor: CloseAnchor;
    popupClassName?: string;
    onClose: (reason?: string) => void;
    children: ReactNode;
};

export function SettingsDialog({
    title,
    className,
    qa,
    closeSize,
    closeAnchor,
    popupClassName,
    onClose,
    children,
    ...popupProps
}: SettingsDialogProps) {
    const titleId = useUniqId();
    const handleOpenChange = closeUnlessAnchor(closeAnchor, onClose);
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => closeOnTabOut(event, onClose);
    const handleCloseClick = () => onClose();
    return (
        <Popup
            open
            {...popupProps}
            className={popupClassName}
            floatingStyles={FLOATING_STYLES}
            onOpenChange={handleOpenChange}
        >
            <dialog
                open
                className={cnBannerSettings('dialog', [className])}
                aria-labelledby={titleId}
                data-qa={qa}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
            >
                <div className={cnBannerSettings('title')}>
                    <Text
                        as="h2"
                        className={cnBannerSettings('heading')}
                        variant="subheader-3"
                        id={titleId}
                    >
                        {title}
                    </Text>
                    <span className={cnBannerSettings('close')}>
                        <Button
                            view="flat"
                            size={closeSize}
                            aria-label={i18n('close')}
                            onClick={handleCloseClick}
                        >
                            <Icon data={Xmark} size={CLOSE_ICON_SIZE} />
                        </Button>
                    </span>
                </div>
                {children}
            </dialog>
        </Popup>
    );
}

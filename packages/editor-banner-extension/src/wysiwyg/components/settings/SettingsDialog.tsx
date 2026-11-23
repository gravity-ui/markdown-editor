import type {ReactNode} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popup, type PopupProps, Text, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {type CloseAnchor, closeOnTabOut, closeUnlessAnchor} from '../../utils/popup';

import {cnBannerSettings} from './classname';

import './SettingsDialog.scss';

const CLOSE_ICON_SIZE = 16;

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
    return (
        <Popup
            open
            {...popupProps}
            className={popupClassName}
            onOpenChange={closeUnlessAnchor(closeAnchor, onClose)}
        >
            <dialog
                open
                className={cnBannerSettings('dialog', [className])}
                aria-labelledby={titleId}
                data-qa={qa}
                tabIndex={-1}
                onKeyDown={(event) => closeOnTabOut(event, onClose)}
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
                    <Button
                        className={cnBannerSettings('close', {size: closeSize})}
                        view="flat"
                        size={closeSize}
                        aria-label={i18n('close')}
                        onClick={() => onClose()}
                    >
                        <Icon data={Xmark} size={CLOSE_ICON_SIZE} />
                    </Button>
                </div>
                {children}
            </dialog>
        </Popup>
    );
}

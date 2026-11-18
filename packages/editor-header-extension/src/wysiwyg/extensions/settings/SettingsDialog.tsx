import type {ReactNode} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popup, type PopupProps, Text, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';

import {cnHeaderSettings} from './classname';

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
    closeAnchor: HTMLElement | null;
    popupClassName?: string;
    onClose: () => void;
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
            onOpenChange={(open, event, reason) => {
                const onAnchor =
                    reason === 'outside-press' &&
                    event?.target instanceof Node &&
                    closeAnchor?.contains(event.target);
                if (!open && !onAnchor) onClose();
            }}
        >
            <section
                className={className}
                role="dialog"
                aria-labelledby={titleId}
                data-qa={qa}
                tabIndex={-1}
            >
                <div className={cnHeaderSettings('title')}>
                    <Text
                        as="h2"
                        className={cnHeaderSettings('heading')}
                        variant="subheader-3"
                        id={titleId}
                    >
                        {title}
                    </Text>
                    <Button
                        className={cnHeaderSettings('close', {size: closeSize})}
                        view="flat"
                        size={closeSize}
                        aria-label={i18n('close')}
                        onClick={() => onClose()}
                    >
                        <Icon data={Xmark} size={CLOSE_ICON_SIZE} />
                    </Button>
                </div>
                {children}
            </section>
        </Popup>
    );
}

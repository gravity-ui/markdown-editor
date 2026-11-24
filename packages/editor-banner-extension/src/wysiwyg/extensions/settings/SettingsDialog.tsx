import type {ReactNode} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {
    Button,
    Icon,
    Popup,
    type PopupProps,
    Text,
    useUniqId,
    useViewportSize,
} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {PopupLayer} from '../PopupLayer';
import {TabOutClose} from '../TabOutClose';
import {type CloseAnchor, closeUnlessAnchor} from '../popup';

import {cnBannerSettings} from './classname';

import './SettingsDialog.scss';

const CLOSE_ICON_SIZE = 16;
const VIEWPORT_INSET = 16;

type SettingsDialogProps = Pick<
    PopupProps,
    'anchorElement' | 'placement' | 'floatingMiddlewares' | 'initialFocus' | 'returnFocus'
> & {
    title: string;
    className: string;
    popupClassName?: string;
    qa: string;
    closeSize: 'm' | 'l';
    closeAnchor: CloseAnchor;
    onClose: (reason?: string) => void;
    children: ReactNode;
};

export function SettingsDialog({
    title,
    className,
    popupClassName,
    qa,
    closeSize,
    closeAnchor,
    onClose,
    children,
    ...popupProps
}: SettingsDialogProps) {
    const titleId = useUniqId();
    const {width} = useViewportSize();
    const style = width ? {maxWidth: width - 2 * VIEWPORT_INSET} : undefined;
    const handleCloseClick = () => onClose();
    return (
        <PopupLayer>
            <Popup
                open
                {...popupProps}
                className={popupClassName}
                onOpenChange={closeUnlessAnchor(closeAnchor, onClose)}
            >
                <TabOutClose onClose={onClose}>
                    <section
                        className={className}
                        role="dialog"
                        aria-labelledby={titleId}
                        data-qa={qa}
                        tabIndex={-1}
                        style={style}
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
                                onClick={handleCloseClick}
                            >
                                <Icon data={Xmark} size={CLOSE_ICON_SIZE} />
                            </Button>
                        </div>
                        {children}
                    </section>
                </TabOutClose>
            </Popup>
        </PopupLayer>
    );
}

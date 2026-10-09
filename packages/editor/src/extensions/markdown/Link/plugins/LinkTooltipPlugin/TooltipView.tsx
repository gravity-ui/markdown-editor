import {memo, useEffect, useState} from 'react';

import {ArrowUpRightFromSquare as LinkIcon, LinkSlash as UnlinkIcon} from '@gravity-ui/icons';
import {Popup, type PopupPlacement, type PopupProps} from '@gravity-ui/uikit';

import {cn} from '../../../../../classname';
import {UrlAction, UrlInput} from '../../../../../forms/UrlInput';
import {i18n} from '../../../../../i18n/forms';

import './TooltipView.scss';

const b = cn('link-tooltip-view');

type LinkProps = {
    href: string;
    anchorElement: HTMLElement;
    placement: PopupPlacement;
    onOpenChange: NonNullable<PopupProps['onOpenChange']>;
    onChange?: (opts: {href: string}) => void;
    onCancel?: () => void;
    onRemove?: () => void;
    onUrlChange?: (url: string) => void;
    autoFocus?: boolean;
    onOpenInNewTab?: () => void;
};

export const Link = memo<LinkProps>(function Link({
    href,
    anchorElement,
    placement,
    onOpenChange,
    onChange,
    onRemove,
    onUrlChange,
    autoFocus,
    onOpenInNewTab,
}) {
    const [url, setUrl] = useState(href);

    const handleUrlUpdate = (v: string) => {
        setUrl(v);
        onUrlChange?.(v);
    };

    const handleSubmit = () => {
        onChange?.({href: url});
    };

    useEffect(() => {
        setUrl(href);
        onUrlChange?.(href);
    }, [href, onUrlChange]);

    return (
        <Popup
            open
            anchorElement={anchorElement}
            className={b('popup')}
            placement={placement}
            onOpenChange={onOpenChange}
        >
            <UrlInput
                className={b()}
                value={url}
                onUpdate={handleUrlUpdate}
                onSubmit={handleSubmit}
                aria-label={i18n('link-href-placeholder')}
                placeholder={i18n('link-href-placeholder')}
                autoFocus={autoFocus}
                actions={
                    url ? (
                        <>
                            {onRemove && (
                                <UrlAction
                                    title={i18n('link_remove_help')}
                                    icon={UnlinkIcon}
                                    onClick={onRemove}
                                />
                            )}
                            <UrlAction
                                title={i18n('link_open_help')}
                                icon={LinkIcon}
                                href={url}
                                onClick={onOpenInNewTab}
                            />
                        </>
                    ) : undefined
                }
            />
        </Popup>
    );
});

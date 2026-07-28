import {memo, useEffect, useState} from 'react';

import {ArrowUpRightFromSquare as LinkIcon, LinkSlash as UnlinkIcon} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Button,
    Icon,
    Popup,
    type PopupPlacement,
    type PopupProps,
    type TextInputProps,
} from '@gravity-ui/uikit';

import {cn} from '../../../../../classname';
import {TextInputFixed} from '../../../../../forms/TextInput';
import {i18n} from '../../../../../i18n/forms';
import {enterKeyHandler} from '../../../../../utils/handlers';

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
    const inputEnterKeyHandler: TextInputProps['onKeyDown'] = enterKeyHandler(handleSubmit);

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
            <div className={b()}>
                <TextInputFixed
                    size="l"
                    hasClear
                    view="clear"
                    value={url}
                    className={b('input', {empty: !url})}
                    onUpdate={handleUrlUpdate}
                    placeholder={i18n('link-href-placeholder')}
                    autoFocus={autoFocus}
                    onKeyDown={inputEnterKeyHandler}
                />
                {url && onRemove && (
                    <ActionTooltip title={i18n('link_remove_help')}>
                        <Button className={b('button')} view="flat" size="m" onClick={onRemove}>
                            <Icon data={UnlinkIcon} size={16} />
                        </Button>
                    </ActionTooltip>
                )}
                {url && (
                    <ActionTooltip title={i18n('link_open_help')}>
                        <Button
                            className={b('button')}
                            view="flat"
                            size="m"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onOpenInNewTab}
                        >
                            <Icon data={LinkIcon} size={16} />
                        </Button>
                    </ActionTooltip>
                )}
            </div>
        </Popup>
    );
});

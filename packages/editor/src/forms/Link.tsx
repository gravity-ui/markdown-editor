import {memo, useState} from 'react';

import {ArrowUpRightFromSquare as LinkIcon} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon, type TextInputProps} from '@gravity-ui/uikit';

import {cn} from '../classname';
import {i18n} from '../i18n/forms';
import {enterKeyHandler} from '../utils/handlers';

import {TextInputFixed} from './TextInput';

import './Link.scss';

const b = cn('link');

export type LinkSubmitParams = {
    url: string;
    text: string;
};

export type LinkProps = {
    autoFocus?: boolean;
    initialUrl?: string;
    initialText?: string;
    readOnlyText?: boolean;
    onSubmit(params: LinkSubmitParams): void;
    onUrlChange?: (url: string) => void;
    onTextChange?: (text: string) => void;
};

export const Link = memo<LinkProps>(function LinkForm({
    autoFocus,
    initialUrl = '',
    initialText = '',
    readOnlyText,
    onSubmit,
    onUrlChange,
    onTextChange,
}) {
    const [url, setUrl] = useState(initialUrl);
    const [text, setText] = useState(initialText);

    const handleUrlUpdate = (v: string) => {
        setUrl(v);
        onUrlChange?.(v);
    };

    const handleTextUpdate = (v: string) => {
        setText(v);
        onTextChange?.(v);
    };

    const handleSubmit = () => {
        onSubmit({url, text});
    };

    const inputEnterKeyHandler: TextInputProps['onKeyDown'] = enterKeyHandler(handleSubmit);

    return (
        <div className={b()}>
            <div className={b('row')}>
                <TextInputFixed
                    size="l"
                    hasClear
                    view="clear"
                    value={url}
                    className={b('input')}
                    onUpdate={handleUrlUpdate}
                    placeholder="https://"
                    autoFocus={autoFocus}
                    onKeyDown={inputEnterKeyHandler}
                />
                <ActionTooltip title={i18n('link_open_help')}>
                    <Button className={b('button')} view="flat" size="m" href={url} target="_blank">
                        <Icon data={LinkIcon} size={16} />
                    </Button>
                </ActionTooltip>
            </div>
            <div className={b('row')}>
                <TextInputFixed
                    size="l"
                    hasClear
                    view="clear"
                    value={text}
                    className={b('input')}
                    onUpdate={handleTextUpdate}
                    placeholder={i18n('link_text')}
                    disabled={readOnlyText}
                    onKeyDown={inputEnterKeyHandler}
                />
            </div>
        </div>
    );
});

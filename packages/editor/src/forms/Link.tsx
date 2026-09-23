import {memo, useState} from 'react';

import {Button, type TextInputProps} from '@gravity-ui/uikit';

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
            <TextInputFixed
                size="l"
                hasClear
                value={url}
                className={b('input')}
                onUpdate={handleUrlUpdate}
                placeholder={i18n('link-href-placeholder')}
                autoFocus={autoFocus}
                onKeyDown={inputEnterKeyHandler}
            />
            <TextInputFixed
                size="l"
                hasClear
                value={text}
                className={b('input')}
                onUpdate={handleTextUpdate}
                placeholder={i18n('link-name-placeholder')}
                disabled={readOnlyText}
                onKeyDown={inputEnterKeyHandler}
            />
            <Button
                disabled={!url}
                className={b('submit-button')}
                view="action"
                size="l"
                onClick={handleSubmit}
            >
                {i18n('link_add')}
            </Button>
        </div>
    );
});

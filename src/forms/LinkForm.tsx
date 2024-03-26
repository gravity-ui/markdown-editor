import React from 'react';

import {TextInput, TextInputProps} from '@gravity-ui/uikit';

import {ClassNameProps} from '../classname';
import {i18n} from '../i18n/forms';

import {TextInputFixed} from './TextInput';
import {UrlInputRow} from './UrlInputRow';
import Form from './base';
import {enterKeyHandler} from './utils';

export type LinkFormSubmitParams = {
    url: string;
    text: string;
};

export type LinkFormProps = ClassNameProps & {
    autoFocus?: boolean;
    initialUrl?: string;
    initialText?: string;
    readOnlyText?: boolean;
    onSubmit(params: LinkFormSubmitParams): void;
    onCancel(): void;
};

export const LinkForm = React.memo<LinkFormProps>(function LinkForm({
    className,
    autoFocus,
    initialUrl,
    initialText,
    readOnlyText,
    onSubmit,
    onCancel,
}) {
    const [url, setUrl] = React.useState(initialUrl ?? '');
    const [text, setText] = React.useState(initialText ?? '');

    const handleSubmit = () => {
        onSubmit({url, text});
    };
    const inputEnterKeyHandler: TextInputProps['onKeyPress'] = enterKeyHandler(handleSubmit);

    return (
        <Form.Form className={className}>
            <Form.Layout>
                <Form.Row
                    label={i18n('common_link')}
                    help={i18n('link_url_help')}
                    control={
                        <UrlInputRow
                            href={url}
                            input={
                                <TextInputFixed
                                    size="s"
                                    view="normal"
                                    value={url}
                                    onUpdate={setUrl}
                                    autoFocus={autoFocus}
                                    placeholder="https://"
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            }
                        />
                    }
                />
                <Form.Row
                    label={i18n('link_text')}
                    help={i18n('link_text_help')}
                    control={
                        <TextInput
                            size="s"
                            view="normal"
                            value={text}
                            onUpdate={setText}
                            disabled={readOnlyText}
                            onKeyPress={inputEnterKeyHandler}
                        />
                    }
                />
            </Form.Layout>
            <Form.Footer onCancel={onCancel} onSubmit={handleSubmit} />
        </Form.Form>
    );
});

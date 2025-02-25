import {memo, useState} from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';

import {TextInputFixed} from '../../../../../forms/TextInput';
import {UrlInputRow} from '../../../../../forms/UrlInputRow';
import Form from '../../../../../forms/base';
import {i18n} from '../../../../../i18n/forms';
import {enterKeyHandler} from '../../../../../utils/handlers';

type LinkFormProps = {
    href: string;
    autoFocus?: boolean;
    onChange?: (opts: {href: string}) => void;
    onCancel?: () => void;
};

export const LinkForm = memo<LinkFormProps>(function LinkForm({
    href,
    autoFocus,
    onChange,
    onCancel,
}) {
    const [url, setUrl] = useState(href);

    const handleSubmit = () => {
        onChange?.({href: url});
    };
    const inputEnterKeyHandler: TextInputProps['onKeyPress'] = enterKeyHandler(handleSubmit);

    return (
        <Form.Form>
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
                                    hasClear
                                    view="normal"
                                    value={url}
                                    onUpdate={setUrl}
                                    placeholder="https://"
                                    autoFocus={autoFocus}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            }
                        />
                    }
                />
            </Form.Layout>
            <Form.Footer onCancel={onCancel} onSubmit={handleSubmit} />
        </Form.Form>
    );
});

import React from 'react';

import {Tabs, TextInput, TextInputProps} from '@gravity-ui/uikit';

import {ClassNameProps, cn} from '../classname';
import {i18n} from '../i18n/forms';
import {isFunction} from '../lodash';
import {enterKeyHandler} from '../utils/handlers';

import {TextInputFixed} from './TextInput';
import Form from './base';
import {ButtonAttach} from './components';

const b = cn('file-form');

const enum TabId {
    Attach = 'attach',
    Link = 'link',
}

export type FileFormSubmitParams = {
    src: string;
    name: string;
};

export type FileFormProps = ClassNameProps & {
    autoFocus?: boolean;
    onSubmit(params: FileFormSubmitParams): void;
    onCancel(): void;
    onAttach?: (files: File[]) => void;
    loading?: boolean;
    uploadHint?: string;
};

export const FileForm: React.FC<FileFormProps> = ({
    className,
    autoFocus,
    onCancel,
    onSubmit,
    onAttach,
    loading,
    uploadHint,
}) => {
    const [tabId, setTabId] = React.useState<string>(() =>
        isFunction(onAttach) ? TabId.Attach : TabId.Link,
    );
    const [src, setSrc] = React.useState('');
    const [name, setName] = React.useState('');

    const shouldRenderTabs = isFunction(onAttach);
    React.useLayoutEffect(() => {
        if (!shouldRenderTabs && tabId === TabId.Attach) {
            setTabId(TabId.Link);
        }
    }, [shouldRenderTabs, tabId]);

    const handleSubmit = () => {
        onSubmit({
            src: src.trim(),
            name: name.trim(),
        });
    };
    const inputEnterKeyHandler: TextInputProps['onKeyDown'] = enterKeyHandler(handleSubmit);

    return (
        <Form.Form className={b(null, [className])}>
            {shouldRenderTabs && (
                <Tabs
                    activeTab={tabId}
                    onSelectTab={setTabId}
                    items={[
                        {id: TabId.Attach, title: i18n('common_tab_attach')},
                        {id: TabId.Link, title: i18n('common_tab_link')},
                    ]}
                />
            )}
            {tabId === TabId.Attach && onAttach && (
                <>
                    <Form.Layout>{uploadHint || i18n('file_upload_help')}</Form.Layout>
                    <Form.Footer onCancel={onCancel}>
                        <ButtonAttach
                            multiple
                            buttonProps={{
                                size: 's',
                                view: 'action',
                                loading,
                            }}
                            onUpdate={onAttach}
                        >
                            {i18n('common_action_upload')}
                        </ButtonAttach>
                    </Form.Footer>
                </>
            )}
            {tabId === TabId.Link && (
                <>
                    <Form.Layout>
                        <Form.Row
                            label={i18n('common_link')}
                            help={i18n('file_link_help')}
                            control={
                                <TextInputFixed
                                    size="s"
                                    view="normal"
                                    value={src}
                                    onUpdate={setSrc}
                                    placeholder="https://"
                                    autoFocus={autoFocus}
                                    className={b('input', {type: 'link'})}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            }
                        />
                        <Form.Row
                            label={i18n('file_name')}
                            control={
                                <TextInput
                                    size="s"
                                    view="normal"
                                    value={name}
                                    onUpdate={setName}
                                    className={b('input', {type: 'name'})}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            }
                        />
                    </Form.Layout>
                    <Form.Footer onCancel={onCancel} onSubmit={handleSubmit} />
                </>
            )}
        </Form.Form>
    );
};

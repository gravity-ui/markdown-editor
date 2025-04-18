import {useLayoutEffect, useState} from 'react';

import {TextInput, type TextInputProps} from '@gravity-ui/uikit';
import {Tabs} from '@gravity-ui/uikit/legacy';

import {type ClassNameProps, cn} from '../classname';
import {i18n} from '../i18n/forms';
import {isFunction} from '../lodash';
import {enterKeyHandler} from '../utils/handlers';

import {TextInputFixed} from './TextInput';
import Form from './base';
import {ButtonAttach, NumberInput} from './components';

import './ImageForm.scss';

const b = cn('image-form');

const enum ImageTabId {
    Attach = 'attach',
    Link = 'link',
}

export type ImageFormSubmitParams = {
    url: string;
    name: string;
    alt: string;
    width?: number;
    height?: number;
};

export type ImageFormProps = ClassNameProps & {
    autoFocus?: boolean;
    onSubmit(params: ImageFormSubmitParams): void;
    onCancel(): void;
    onAttach?: (files: File[]) => void;
    loading?: boolean;
    imageTitle?: string;
};

export const ImageForm: React.FC<ImageFormProps> = ({
    className,
    autoFocus,
    onCancel,
    onSubmit,
    onAttach,
    loading,
    imageTitle: providedName,
}) => {
    const [tabId, setTabId] = useState<string>(() =>
        isFunction(onAttach) ? ImageTabId.Attach : ImageTabId.Link,
    );
    const [url, setUrl] = useState('');
    const [name, setName] = useState(providedName ?? '');
    const [alt, setAlt] = useState('');
    const [width, setWidth] = useState<number | undefined>();
    const [height, setHeight] = useState<number | undefined>();

    const shouldRenderTabs = isFunction(onAttach);
    useLayoutEffect(() => {
        if (!shouldRenderTabs && tabId === ImageTabId.Attach) {
            setTabId(ImageTabId.Link);
        }
    }, [shouldRenderTabs, tabId]);

    const handleSubmit = () => {
        const data: ImageFormSubmitParams = {
            url: url.trim(),
            name: name.trim(),
            alt: alt.trim(),
        };
        if (typeof width === 'number' && width >= 0) data.width = width;
        if (typeof height === 'number' && height >= 0) data.height = height;
        onSubmit(data);
    };
    const inputEnterKeyHandler: TextInputProps['onKeyDown'] = enterKeyHandler(handleSubmit);

    return (
        <Form.Form className={b(null, [className])}>
            {shouldRenderTabs && (
                <Tabs
                    activeTab={tabId}
                    onSelectTab={setTabId}
                    items={[
                        {id: ImageTabId.Attach, title: i18n('common_tab_attach')},
                        {id: ImageTabId.Link, title: i18n('common_tab_link')},
                    ]}
                />
            )}
            {tabId === ImageTabId.Attach && onAttach && (
                <>
                    <Form.Layout>{i18n('image_upload_help')}</Form.Layout>
                    <Form.Footer onCancel={onCancel}>
                        <ButtonAttach
                            multiple
                            accept="image/*"
                            onUpdate={onAttach}
                            buttonProps={{size: 's', view: 'action', loading}}
                        >
                            {i18n('common_action_upload')}
                        </ButtonAttach>
                    </Form.Footer>
                </>
            )}
            {tabId === ImageTabId.Link && (
                <>
                    <Form.Layout>
                        <Form.Row
                            label={i18n('common_link')}
                            control={
                                <TextInputFixed
                                    size="s"
                                    view="normal"
                                    value={url}
                                    onUpdate={setUrl}
                                    placeholder="https://"
                                    autoFocus={autoFocus}
                                    className={b('input', {type: 'link'})}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            }
                        />
                        <Form.Row
                            label={i18n('image_name')}
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
                        <Form.Row
                            label={i18n('image_alt')}
                            help={i18n('image_alt_help')}
                            control={
                                <TextInput
                                    size="s"
                                    view="normal"
                                    value={alt}
                                    onUpdate={setAlt}
                                    className={b('input', {type: 'alt'})}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            }
                        />
                        <Form.Row
                            label={i18n('common_sizes')}
                            control={
                                <div className={b('size-controls')}>
                                    <NumberInput
                                        min={0}
                                        size="s"
                                        view="normal"
                                        value={width}
                                        onUpdate={setWidth}
                                        placeholder={i18n('image_size_width')}
                                        className={b('input', {type: 'width'})}
                                        onKeyDown={inputEnterKeyHandler}
                                    />
                                    x
                                    <NumberInput
                                        min={0}
                                        size="s"
                                        view="normal"
                                        value={height}
                                        onUpdate={setHeight}
                                        placeholder={i18n('image_size_height')}
                                        className={b('input', {type: 'height'})}
                                        onKeyDown={inputEnterKeyHandler}
                                    />
                                </div>
                            }
                        />
                    </Form.Layout>
                    <Form.Footer onCancel={onCancel} onSubmit={handleSubmit} />
                </>
            )}
        </Form.Form>
    );
};

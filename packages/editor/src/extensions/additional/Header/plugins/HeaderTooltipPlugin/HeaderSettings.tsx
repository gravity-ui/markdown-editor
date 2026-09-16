import {useEffect, useState} from 'react';

import {Button, Select, type SelectOption} from '@gravity-ui/uikit';

import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {TextInputFixed} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {
    type HeaderAttrs,
    HeaderBackground,
    HeaderBorder,
    HeaderEdges,
    HeaderFormat,
    HeaderLayout,
    HeaderTextColor,
} from '../../HeaderSpecs';
import {toCssUrl} from '../../HeaderSpecs/dom';
import {type FoundHeader, removeHeaderActionAt, setHeaderActionAttrs} from '../../commands';

import {useImageUpload} from './useImageUpload';

const b = cn('header-toolbar');
type SettingsProps = {attrs: HeaderAttrs; onChange: (patch: Partial<HeaderAttrs>) => void};

function Choice<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: SelectOption[];
    onChange: (value: T) => void;
}) {
    return (
        <div className={b('field')}>
            <span>{label}</span>
            <Select
                disablePortal
                aria-label={label}
                value={[value]}
                options={options}
                onUpdate={([next]) => onChange(next as T)}
            />
        </div>
    );
}

export function AppearanceSettings({attrs, onChange}: SettingsProps) {
    return (
        <div className={b('settings')}>
            <Choice
                label={i18n('format')}
                value={attrs.format}
                onChange={(format) => onChange({format})}
                options={[
                    {value: HeaderFormat.Large, content: i18n('format.large')},
                    {value: HeaderFormat.Small, content: i18n('format.small')},
                ]}
            />
            <Choice
                label={i18n('edges')}
                value={attrs.edges}
                onChange={(edges) => onChange({edges})}
                options={[
                    {value: HeaderEdges.Rounded, content: i18n('edges.rounded')},
                    {value: HeaderEdges.Bleed, content: i18n('edges.bleed')},
                ]}
            />
            <Choice
                label={i18n('border')}
                value={attrs.border}
                onChange={(border) => onChange({border})}
                options={[
                    {value: HeaderBorder.None, content: i18n('border.none')},
                    {value: HeaderBorder.Solid, content: i18n('border.solid')},
                    {value: HeaderBorder.Dashed, content: i18n('border.dashed')},
                    {value: HeaderBorder.Dotted, content: i18n('border.dotted')},
                ]}
            />
            <Choice
                label={i18n('text')}
                value={attrs.text}
                onChange={(text) => onChange({text})}
                options={[
                    {value: HeaderTextColor.Auto, content: i18n('text.auto')},
                    {value: HeaderTextColor.Light, content: i18n('text.light')},
                    {value: HeaderTextColor.Dark, content: i18n('text.dark')},
                ]}
            />
        </div>
    );
}

export function ImageSettings({
    attrs,
    onChange,
    pos,
    editorView,
    fileUploadHandler,
    onClose,
}: SettingsProps & {
    pos: number;
    editorView: EditorView;
    fileUploadHandler?: FileUploadHandler;
    onClose: () => void;
}) {
    const [url, setUrl] = useState(attrs.image);
    const {pick, uploading} = useImageUpload(editorView, pos, fileUploadHandler);
    useEffect(() => setUrl(attrs.image), [attrs.image]);
    const valid = Boolean(toCssUrl(url));
    const apply = () => {
        if (!valid || uploading) return;
        onChange({image: url.trim(), bg: HeaderBackground.Image});
        onClose();
    };

    return (
        <div className={b('settings')}>
            <TextInputFixed
                autoFocus
                controlProps={{'aria-label': i18n('image.url')}}
                placeholder="https://"
                value={url}
                onUpdate={setUrl}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        apply();
                    }
                }}
            />
            <div className={b('buttons')}>
                {pick && (
                    <Button loading={uploading} onClick={pick}>
                        {i18n('image.upload')}
                    </Button>
                )}
                <Button view="action" disabled={!valid || uploading} onClick={apply}>
                    {i18n('apply')}
                </Button>
            </div>
            {attrs.bg === HeaderBackground.Image && (
                <>
                    <Choice
                        label={i18n('layout')}
                        value={attrs.layout}
                        onChange={(layout) => onChange({layout})}
                        options={[
                            {value: HeaderLayout.Cover, content: i18n('layout.cover')},
                            {value: HeaderLayout.Split, content: i18n('layout.split')},
                        ]}
                    />
                    <Button
                        view="flat-danger"
                        disabled={uploading}
                        onClick={() => {
                            onChange({image: '', bg: HeaderBackground.Fill});
                            onClose();
                        }}
                    >
                        {i18n('image.reset')}
                    </Button>
                </>
            )}
        </div>
    );
}

export function ActionSettings({
    action,
    editorView,
    onClose,
}: {
    action: FoundHeader;
    editorView: EditorView;
    onClose: () => void;
}) {
    const [href, setHref] = useState(action.node.attrs.href as string);
    const [type, setType] = useState(action.node.attrs.type as 'button' | 'link');
    const apply = () => {
        setHeaderActionAttrs(action.pos, {href: href.trim(), type})(
            editorView.state,
            editorView.dispatch,
        );
        onClose();
    };

    return (
        <div className={b('settings')}>
            <TextInputFixed
                autoFocus
                controlProps={{'aria-label': i18n('cta.href')}}
                placeholder="https://"
                value={href}
                onUpdate={setHref}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        apply();
                    }
                }}
            />
            <Choice
                label={i18n('cta.type')}
                value={type}
                onChange={setType}
                options={[
                    {value: 'button', content: i18n('cta.type_button')},
                    {value: 'link', content: i18n('cta.type_link')},
                ]}
            />
            <div className={b('buttons')}>
                <Button
                    view="flat-danger"
                    onClick={() => {
                        removeHeaderActionAt(action.pos)(editorView.state, editorView.dispatch);
                        onClose();
                    }}
                >
                    {i18n('cta.remove')}
                </Button>
                <Button view="action" onClick={apply}>
                    {i18n('apply')}
                </Button>
            </div>
        </div>
    );
}

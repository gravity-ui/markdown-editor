import {type ReactNode, useReducer, useState} from 'react';

import {
    ChevronDown,
    ChevronUp,
    ObjectsAlignBottom,
    ObjectsAlignCenterHorizontal,
    ObjectsAlignCenterVertical,
    ObjectsAlignLeft,
    ObjectsAlignRight,
    ObjectsAlignTop,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import {
    Button,
    Icon,
    Popup,
    SegmentedRadioGroup,
    Select,
    Switch,
    TextInput,
    useToaster,
} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {
    HeaderAttr,
    type HeaderAttrs,
    HeaderBackground,
    HeaderLayer,
    normalizeHeaderAttrs,
} from '../../HeaderSpecs';
import {headerAt, setHeaderAction, setHeaderAttrs} from '../../commands';
import {uploadHeaderImage} from '../imageUpload';

import {HeaderColorControl} from './HeaderColorControl';

import './HeaderSettings.scss';

const b = cn('header-settings');
const horizontalIcons = [ObjectsAlignLeft, ObjectsAlignCenterHorizontal, ObjectsAlignRight];
const verticalIcons = [ObjectsAlignTop, ObjectsAlignCenterVertical, ObjectsAlignBottom];
type Label = Parameters<typeof i18n>[0];

function SettingsSection({label, children}: {label: string; children: ReactNode}) {
    const [open, setOpen] = useState(true);
    return (
        <section className={b('section')}>
            <Button
                className={b('section-heading')}
                view="flat-secondary"
                width="max"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <span>{label}</span>
                <Icon data={open ? ChevronUp : ChevronDown} size={16} />
            </Button>
            {open && children}
        </section>
    );
}

const colorOption = (value: string, label: string, kind = 'fill') => ({
    value,
    text: label,
    content: (
        <span className={b('select-value')}>
            <span aria-hidden className={b('swatch', {[kind]: value})} />
            <span>{label}</span>
        </span>
    ),
});

function imageFileName(url: string) {
    try {
        return (
            decodeURIComponent(
                new URL(url, 'https://example.com').pathname.split('/').pop() ?? '',
            ) || i18n('image')
        );
    } catch {
        return i18n('image');
    }
}

export function HeaderSettings({
    node,
    pos,
    editorView,
    anchorElement,
    hide,
    fileUploadHandler,
}: {
    node: Node;
    pos: number;
    editorView: EditorView;
    anchorElement: HTMLElement | null;
    hide: () => void;
    fileUploadHandler?: FileUploadHandler;
}) {
    const toaster = useToaster();
    const [, refresh] = useReducer((value: number) => value + 1, 0);
    const current = headerAt(editorView.state.doc, pos) ?? node;
    const attrs = normalizeHeaderAttrs(current.attrs);
    const [imageControlsVisible, setImageControlsVisible] = useState(
        Boolean(attrs.image) && attrs['image-enabled'] === 'true',
    );
    const patch = (next: Partial<HeaderAttrs>) => {
        setHeaderAttrs(pos, next)(editorView.state, editorView.dispatch);
        refresh();
    };
    const row = (label: string, control: ReactNode) => (
        <div className={b('row')}>
            <span className={b('label')}>{label}</span>
            <div className={b('control')}>{control}</div>
        </div>
    );
    const toggle = (attr: keyof HeaderAttrs, label: Label) =>
        row(
            i18n(label),
            <Switch
                size="m"
                checked={attrs[attr] === 'true'}
                controlProps={{'aria-label': i18n(label)}}
                onUpdate={(checked) => patch({[attr]: String(checked)})}
            />,
        );
    const actions = current.child(2);
    const updateAction = (
        index: number,
        next: Partial<{text: string; href: string; type: string; color: string; enabled: boolean}>,
    ) => {
        const action = index < actions.childCount ? actions.child(index) : null;
        setHeaderAction(pos, index, {
            text: action?.textContent || i18n('action'),
            href: String(action?.attrs.href ?? ''),
            type: String(action?.attrs.type ?? 'button'),
            color: String(action?.attrs.color ?? 'brand'),
            enabled: action?.attrs.enabled !== false,
            ...next,
        })(editorView.state, editorView.dispatch);
        refresh();
    };
    const uploadImage = async () => {
        if (!fileUploadHandler) return;
        const result = await uploadHeaderImage(editorView, pos, fileUploadHandler);
        if (result === 'failed')
            toaster.add({name: 'header-image-upload', theme: 'danger', title: i18n('image_error')});
        refresh();
    };
    const fileName = attrs['image-name'] || imageFileName(attrs.image);

    return (
        <Popup
            className={b('popup')}
            open
            anchorElement={anchorElement}
            placement={['right-start', 'left-start']}
            onOpenChange={hide}
        >
            <div className={b()} role="dialog" aria-label={i18n('settings')}>
                <div className={b('heading')}>
                    <span>{i18n('settings')}</span>
                    <Button view="flat" size="m" aria-label={i18n('close')} onClick={hide}>
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
                {row(
                    i18n('format'),
                    <SegmentedRadioGroup
                        size="m"
                        width="max"
                        value={attrs.format}
                        aria-label={i18n('format')}
                        options={['small', 'medium', 'large'].map((value, index) => ({
                            value,
                            content: ['S', 'M', 'L'][index],
                        }))}
                        onUpdate={(format) => patch({format})}
                    />,
                )}
                {toggle(HeaderAttr.Fixed, 'fixed')}
                <span>{i18n('alignment')}</span>
                <div className={b('alignment')}>
                    {row(
                        i18n('vertical'),
                        <SegmentedRadioGroup
                            size="m"
                            width="max"
                            value={attrs.vertical}
                            aria-label={i18n('vertical')}
                            options={['top', 'center', 'bottom'].map((value, index) => ({
                                value,
                                title: i18n(value as Label),
                                content: (
                                    <span
                                        className={b('alignment-icon')}
                                        role="img"
                                        aria-label={i18n(value as Label)}
                                    >
                                        <Icon data={verticalIcons[index]} size={16} />
                                    </span>
                                ),
                            }))}
                            onUpdate={(vertical) => patch({vertical})}
                        />,
                    )}
                    {row(
                        i18n('align'),
                        <SegmentedRadioGroup
                            size="m"
                            width="max"
                            value={attrs.align}
                            aria-label={i18n('align')}
                            options={['left', 'center', 'right'].map((value, index) => ({
                                value,
                                title: i18n(value as Label),
                                content: (
                                    <span
                                        className={b('alignment-icon')}
                                        role="img"
                                        aria-label={i18n(value as Label)}
                                    >
                                        <Icon data={horizontalIcons[index]} size={16} />
                                    </span>
                                ),
                            }))}
                            onUpdate={(align) => patch({align})}
                        />,
                    )}
                </div>
                <SettingsSection label={i18n('content')}>
                    {toggle(HeaderAttr.Title, 'title')}
                    {toggle(HeaderAttr.Description, 'description')}
                    {row(
                        i18n('text'),
                        <HeaderColorControl
                            kind="text"
                            label={i18n('text')}
                            value={attrs.text}
                            onUpdate={(text) => patch({text: text || 'auto'})}
                        />,
                    )}
                </SettingsSection>
                <SettingsSection label={i18n('actions')}>
                    {[0, 1, 2].map((index) => {
                        const action = index < actions.childCount ? actions.child(index) : null;
                        const label = `${i18n('action')} ${index + 1}`;
                        const enabled = Boolean(action) && action?.attrs.enabled !== false;
                        const buttonStyle = action?.attrs.color === 'brand' ? 'brand' : 'normal';
                        return (
                            <div key={index} className={b('action')}>
                                {row(
                                    label,
                                    <Switch
                                        size="m"
                                        checked={enabled}
                                        controlProps={{'aria-label': label}}
                                        onUpdate={(checked) =>
                                            updateAction(index, {enabled: checked})
                                        }
                                    />,
                                )}
                                {enabled && action && (
                                    <>
                                        {row(
                                            i18n('action_style'),
                                            <Select
                                                size="m"
                                                width="max"
                                                aria-label={`${label}: ${i18n('action_style')}`}
                                                renderSelectedOption={(option) => (
                                                    <>{option.content}</>
                                                )}
                                                value={[
                                                    action.attrs.type === 'link'
                                                        ? 'flat'
                                                        : buttonStyle,
                                                ]}
                                                options={['brand', 'normal', 'flat'].map((value) =>
                                                    colorOption(
                                                        value,
                                                        i18n(`action_${value}` as Label),
                                                        'style',
                                                    ),
                                                )}
                                                onUpdate={([value]) =>
                                                    updateAction(index, {
                                                        type: value === 'flat' ? 'link' : 'button',
                                                        color:
                                                            value === 'brand' ? 'brand' : 'default',
                                                    })
                                                }
                                            />,
                                        )}
                                        {row(
                                            i18n('action_text'),
                                            <TextInput
                                                size="m"
                                                value={action.textContent}
                                                controlProps={{
                                                    'aria-label': `${label}: ${i18n('action_text')}`,
                                                }}
                                                onUpdate={(text) => updateAction(index, {text})}
                                            />,
                                        )}
                                        {row(
                                            i18n('action_link'),
                                            <div className={b('link')}>
                                                <Select
                                                    size="m"
                                                    width="max"
                                                    aria-label={`${label}: ${i18n('action_link')}`}
                                                    value={['page']}
                                                    options={[
                                                        {
                                                            value: 'page',
                                                            content: i18n('action_page'),
                                                        },
                                                    ]}
                                                />
                                                <TextInput
                                                    size="m"
                                                    value={String(action.attrs.href)}
                                                    placeholder={i18n('action_href')}
                                                    controlProps={{
                                                        'aria-label': `${label}: ${i18n('action_href')}`,
                                                    }}
                                                    onUpdate={(href) => updateAction(index, {href})}
                                                />
                                            </div>,
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </SettingsSection>
                <SettingsSection label={i18n('background')}>
                    {row(
                        i18n('color'),
                        <HeaderColorControl
                            kind="fill"
                            label={i18n('color')}
                            value={attrs.bg === HeaderBackground.Surface ? '' : attrs.fill}
                            onUpdate={(fill) =>
                                patch(
                                    fill
                                        ? {fill, bg: HeaderBackground.Fill}
                                        : {bg: HeaderBackground.Surface},
                                )
                            }
                        />,
                    )}
                    {row(
                        i18n('image'),
                        <Switch
                            size="m"
                            checked={imageControlsVisible}
                            controlProps={{'aria-label': i18n('image')}}
                            onUpdate={(checked) => {
                                setImageControlsVisible(checked);
                                patch({[HeaderAttr.ImageEnabled]: String(checked)});
                            }}
                        />,
                    )}
                    {imageControlsVisible && (
                        <>
                            {row(
                                i18n('file'),
                                <div className={b('file')}>
                                    {attrs.image ? (
                                        <>
                                            <Button
                                                className={b('file-name')}
                                                view="outlined"
                                                width="max"
                                                size="m"
                                                title={fileName}
                                                aria-label={`${i18n('file')}: ${fileName}`}
                                                disabled={!fileUploadHandler}
                                                onClick={uploadImage}
                                            >
                                                <img
                                                    className={b('thumbnail')}
                                                    src={attrs.image}
                                                    alt=""
                                                />
                                                <span>{fileName}</span>
                                            </Button>
                                            <Button
                                                view="flat"
                                                size="m"
                                                aria-label={i18n('image_remove')}
                                                onClick={() =>
                                                    patch({image: '', [HeaderAttr.ImageName]: ''})
                                                }
                                            >
                                                <Icon data={TrashBin} size={16} />
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="m"
                                            width="max"
                                            disabled={!fileUploadHandler}
                                            onClick={uploadImage}
                                        >
                                            {i18n('image_add')}
                                        </Button>
                                    )}
                                </div>,
                            )}
                            {row(
                                i18n('layer'),
                                <Select
                                    size="m"
                                    width="max"
                                    aria-label={i18n('layer')}
                                    value={[attrs.layer]}
                                    options={[
                                        HeaderLayer.Full,
                                        HeaderLayer.Left,
                                        HeaderLayer.Right,
                                    ].map((value) => ({
                                        value,
                                        content: i18n(`layer_${value}` as Label),
                                    }))}
                                    onUpdate={([layer]) => patch({layer})}
                                />,
                            )}
                        </>
                    )}
                </SettingsSection>
            </div>
        </Popup>
    );
}

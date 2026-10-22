import {type ReactNode, useEffect, useReducer, useRef, useState} from 'react';

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
    Checkbox,
    Icon,
    Popup,
    Portal,
    SegmentedRadioGroup,
    Select,
    Switch,
    TextInput,
    useToaster,
} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {CELL_BG_SWATCHES} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/components/CellBgPalette/colors';
import {i18n} from 'src/i18n/header';
import {i18n as tableI18n} from 'src/i18n/yfm-table';
import type {FileUploadHandler} from 'src/utils/upload';

import {ButtonFields} from '../../../Button/ButtonFields';
import {type ButtonAttrs, normalizeButtonAttrs} from '../../../Button/ButtonSpecs';
import {type HeaderAttrs, normalizeHeaderAttrs} from '../../HeaderSpecs';
import {safeImageUrl} from '../../HeaderSpecs/dom';
import {headerAt, setHeaderAttrs, setHeaderButton, setHeaderMedia} from '../../commands';
import {uploadHeaderImage} from '../imageUpload';

import {HeaderColorControl} from './HeaderColorControl';

import './HeaderSettings.scss';

const b = cn('header-settings');
const horizontal = [
    {value: 'left', key: 'left', icon: ObjectsAlignLeft},
    {value: 'center', key: 'center', icon: ObjectsAlignCenterHorizontal},
    {value: 'right', key: 'right', icon: ObjectsAlignRight},
] as const;
const vertical = [
    {value: 'top', key: 'top', icon: ObjectsAlignTop},
    {value: 'center', key: 'center', icon: ObjectsAlignCenterVertical},
    {value: 'bottom', key: 'bottom', icon: ObjectsAlignBottom},
] as const;
const shapes = [
    {value: 'none', key: 'shapes_none'},
    {value: 'diagonal', key: 'shapes_diagonal'},
    {value: 'corner', key: 'shapes_corner'},
    {value: 'edges', key: 'shapes_edges'},
    {value: 'bottom', key: 'shapes_bottom'},
    {value: 'scatter', key: 'shapes_scatter'},
] as const;
function Section({label, children}: {label: string; children: ReactNode}) {
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
const row = (label: string, control: ReactNode) => (
    <div className={b('row')}>
        <span className={b('label')}>{label}</span>
        <div className={b('control')}>{control}</div>
    </div>
);
function BackgroundControl({
    attrs,
    patch,
    upload,
    canUpload,
}: {
    attrs: HeaderAttrs;
    patch: (next: Partial<HeaderAttrs>) => void;
    upload: () => Promise<void>;
    canUpload: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState(attrs.image ? 'image' : 'color');
    const anchor = useRef<HTMLButtonElement>(null);
    const fill = CELL_BG_SWATCHES.find((item) => item.value === attrs.fill);
    const backgroundLabel = fill ? tableI18n(fill.i18nKey) : i18n('no_background');
    return (
        <>
            <Button
                ref={anchor}
                view="outlined"
                width="max"
                className={b('file-name')}
                aria-label={i18n('background_field')}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                {safeImageUrl(attrs.image) && (
                    <img className={b('thumbnail')} src={attrs.image} alt="" />
                )}
                {!attrs.image && attrs.fill !== 'none' && (
                    <span aria-hidden className={b('swatch')} data-fill={attrs.fill} />
                )}
                <span>
                    {attrs.image
                        ? attrs['image-name'] || attrs.image.split('/').pop()
                        : backgroundLabel}
                </span>
            </Button>
            <Popup
                open={open}
                anchorElement={anchor.current}
                placement={['bottom-end', 'top-end']}
                onOpenChange={setOpen}
            >
                <div
                    className={b('background-popup')}
                    role="dialog"
                    aria-label={i18n('background_field')}
                    data-qa="g-md-header-background"
                >
                    <div className={b('background-heading')}>
                        <SegmentedRadioGroup
                            value={tab}
                            aria-label={i18n('background_type')}
                            options={[
                                {value: 'color', content: i18n('color')},
                                {value: 'image', content: i18n('image')},
                            ]}
                            onUpdate={setTab}
                        />
                        <Button
                            view="flat-secondary"
                            onClick={() => {
                                patch({fill: 'none', image: '', 'image-name': ''});
                                setOpen(false);
                            }}
                        >
                            {i18n('reset')}
                        </Button>
                    </div>
                    {tab === 'color' ? (
                        <HeaderColorControl
                            kind="fill"
                            label={i18n('color')}
                            value={attrs.fill === 'none' ? '' : attrs.fill}
                            onUpdate={(fill) => {
                                patch({fill: fill || 'none', image: '', 'image-name': ''});
                                setOpen(false);
                            }}
                        />
                    ) : (
                        <>
                            {safeImageUrl(attrs.image) && (
                                <>
                                    <img
                                        className={b('background-preview')}
                                        src={attrs.image}
                                        alt=""
                                    />
                                    <Button
                                        view="flat-danger"
                                        onClick={() => patch({image: '', 'image-name': ''})}
                                    >
                                        {i18n('image_remove')}
                                    </Button>
                                </>
                            )}
                            <Button
                                view="outlined"
                                width="max"
                                disabled={!canUpload}
                                onClick={upload}
                            >
                                {i18n('image_add')}
                            </Button>
                            <span className={b('upload-hint')}>{i18n('image_size')}</span>
                        </>
                    )}
                </div>
            </Popup>
        </>
    );
}
export function HeaderSettings({
    node,
    pos,
    editorView,
    hide,
    fileUploadHandler,
}: {
    node: Node;
    pos: number;
    editorView: EditorView;
    anchorElement?: HTMLElement | null;
    hide: () => void;
    fileUploadHandler?: FileUploadHandler;
}) {
    const toaster = useToaster();
    const [, refresh] = useReducer((value: number) => value + 1, 0);
    const current = headerAt(editorView.state.doc, pos) ?? node;
    const attrs = normalizeHeaderAttrs(current.attrs);
    const media = current.child(3);
    const patch = (next: Partial<HeaderAttrs>) => {
        setHeaderAttrs(pos, next)(editorView.state, editorView.dispatch);
        refresh();
    };
    const patchMedia = (next: Record<string, unknown>) => {
        setHeaderMedia(pos, next)(editorView.state, editorView.dispatch);
        refresh();
    };
    const upload = async (target: 'background' | 'media' = 'background') => {
        if (!fileUploadHandler) return;
        const result = await uploadHeaderImage(editorView, pos, fileUploadHandler, target);
        if (result === 'failed')
            toaster.add({name: 'header-image-upload', theme: 'danger', title: i18n('image_error')});
        refresh();
    };
    const toggle = (key: 'title' | 'description', label: string) =>
        row(
            label,
            <Switch
                checked={attrs[key] === 'true'}
                controlProps={{'aria-label': label}}
                onUpdate={(checked) => patch({[key]: String(checked)})}
            />,
        );
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !event.defaultPrevented) {
                event.stopPropagation();
                hide();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [hide]);
    const buttons = current.child(2);
    return (
        <Portal>
            <div
                className={b()}
                role="dialog"
                tabIndex={-1}
                aria-label={i18n('settings')}
                data-qa="g-md-header-settings"
            >
                <div className={b('heading')}>
                    <span>{i18n('settings')}</span>
                    <Button view="flat" aria-label={i18n('close')} onClick={hide}>
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
                {row(
                    i18n('height'),
                    <Select
                        width="max"
                        aria-label={i18n('height')}
                        value={[attrs.height]}
                        options={['s', 'm', 'l'].map((value) => ({
                            value,
                            content: value.toUpperCase(),
                        }))}
                        onUpdate={([height]) => patch({height})}
                    />,
                )}
                {row(
                    i18n('width'),
                    <Select
                        width="max"
                        aria-label={i18n('width')}
                        value={[attrs.width]}
                        options={['s', 'm', 'l', 'full'].map((value) => ({
                            value,
                            content: value === 'full' ? i18n('full_width') : value.toUpperCase(),
                        }))}
                        onUpdate={([width]) => patch({width})}
                    />,
                )}
                <Section label={i18n('content')}>
                    {toggle('title', i18n('title'))}
                    {toggle('description', i18n('description'))}
                    <span>{i18n('alignment')}</span>
                    {row(
                        i18n('align'),
                        <SegmentedRadioGroup
                            width="max"
                            value={attrs.align}
                            aria-label={i18n('align')}
                            options={horizontal.map(({value, key, icon}) => ({
                                value,
                                title: i18n(key),
                                content: (
                                    <span role="img" aria-label={i18n(key)}>
                                        <Icon data={icon} size={16} />
                                    </span>
                                ),
                            }))}
                            onUpdate={(align) => patch({align})}
                        />,
                    )}
                    {row(
                        i18n('vertical'),
                        <SegmentedRadioGroup
                            width="max"
                            value={attrs.vertical}
                            aria-label={i18n('vertical')}
                            options={vertical.map(({value, key, icon}) => ({
                                value,
                                title: i18n(key),
                                content: (
                                    <span role="img" aria-label={i18n(key)}>
                                        <Icon data={icon} size={16} />
                                    </span>
                                ),
                            }))}
                            onUpdate={(vertical) => patch({vertical})}
                        />,
                    )}
                    {row(
                        i18n('text'),
                        <HeaderColorControl
                            kind="text"
                            label={i18n('text')}
                            value={attrs.text}
                            onUpdate={(text) => patch({text: text || 'auto'})}
                        />,
                    )}
                </Section>
                <Section label={i18n('actions')}>
                    {[0, 1, 2].map((index) => {
                        const button = index < buttons.childCount ? buttons.child(index) : null;
                        const label = `${i18n('action')} ${index + 1}`;
                        const enabled = button?.attrs.enabled === true;
                        const update = (next: Partial<ButtonAttrs>) => {
                            setHeaderButton(pos, index, {
                                ...(button?.attrs ?? {label: i18n('action')}),
                                ...next,
                            })(editorView.state, editorView.dispatch);
                            refresh();
                        };
                        return (
                            <div key={index} className={b('action')}>
                                {row(
                                    label,
                                    <Switch
                                        checked={enabled}
                                        controlProps={{'aria-label': label}}
                                        onUpdate={(checked) => update({enabled: checked})}
                                    />,
                                )}
                                {enabled && (
                                    <ButtonFields
                                        panel
                                        label={label}
                                        attrs={normalizeButtonAttrs(button?.attrs)}
                                        onUpdate={update}
                                    />
                                )}
                            </div>
                        );
                    })}
                </Section>
                <Section label={i18n('background')}>
                    {row(
                        i18n('background_field'),
                        <BackgroundControl
                            attrs={attrs}
                            patch={patch}
                            upload={() => upload()}
                            canUpload={Boolean(fileUploadHandler)}
                        />,
                    )}
                    {Boolean(attrs.image) && attrs['image-enabled'] === 'true' && (
                        <>
                            {row(
                                '',
                                <Checkbox
                                    checked={attrs.effect === 'blur'}
                                    onUpdate={(checked) =>
                                        patch({effect: checked ? 'blur' : 'none'})
                                    }
                                >
                                    {i18n('blur')}
                                </Checkbox>,
                            )}
                            {row(
                                i18n('image_theme'),
                                <Select
                                    width="max"
                                    aria-label={i18n('image_theme')}
                                    value={[attrs['bg-image-theme']]}
                                    options={[
                                        {value: 'system', content: i18n('image_theme_system')},
                                        {value: 'light', content: i18n('image_theme_light')},
                                        {value: 'dark', content: i18n('image_theme_dark')},
                                    ]}
                                    onUpdate={([theme]) => patch({'bg-image-theme': theme})}
                                />,
                            )}
                        </>
                    )}
                    {row(
                        i18n('media'),
                        <Switch
                            checked={attrs.align !== 'center' && media.attrs.enabled === 'true'}
                            disabled={attrs.align === 'center'}
                            controlProps={{'aria-label': i18n('media')}}
                            onUpdate={(checked) => patchMedia({enabled: String(checked)})}
                        />,
                    )}
                    {attrs.align !== 'center' && media.attrs.enabled === 'true' && (
                        <>
                            {row(
                                i18n('file'),
                                <div className={b('file')}>
                                    <Button
                                        width="max"
                                        disabled={!fileUploadHandler}
                                        onClick={() => upload('media')}
                                    >
                                        {media.attrs.name || i18n('image_add')}
                                    </Button>
                                    {media.attrs.src && (
                                        <Button
                                            view="flat"
                                            aria-label={i18n('media_remove')}
                                            onClick={() => patchMedia({src: '', name: ''})}
                                        >
                                            <Icon data={TrashBin} size={16} />
                                        </Button>
                                    )}
                                </div>,
                            )}
                            {media.attrs.src &&
                                row(
                                    i18n('alt'),
                                    <TextInput
                                        value={media.attrs.alt}
                                        controlProps={{'aria-label': i18n('alt')}}
                                        onUpdate={(alt) => patchMedia({alt})}
                                    />,
                                )}
                        </>
                    )}
                    {row(
                        i18n('shapes'),
                        <Select
                            width="max"
                            aria-label={i18n('shapes')}
                            value={[attrs.shapes]}
                            options={shapes.map(({value, key}) => ({value, content: i18n(key)}))}
                            onUpdate={([value]) => patch({shapes: value})}
                        />,
                    )}
                </Section>
            </div>
        </Portal>
    );
}

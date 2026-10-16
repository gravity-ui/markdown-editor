import {type ReactNode, useReducer} from 'react';

import {
    ObjectsAlignBottom,
    ObjectsAlignCenterHorizontal,
    ObjectsAlignCenterVertical,
    ObjectsAlignLeft,
    ObjectsAlignRight,
    ObjectsAlignTop,
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
    HEADER_FILLS,
    HeaderAttr,
    type HeaderAttrs,
    HeaderBackground,
    HeaderLayer,
    HeaderText,
    normalizeHeaderAttrs,
} from '../../HeaderSpecs';
import {headerAt, setHeaderAction, setHeaderAttrs} from '../../commands';
import {uploadHeaderImage} from '../imageUpload';

import './HeaderSettings.scss';

const b = cn('header-settings');
const horizontalIcons = [ObjectsAlignLeft, ObjectsAlignCenterHorizontal, ObjectsAlignRight];
const verticalIcons = [ObjectsAlignTop, ObjectsAlignCenterVertical, ObjectsAlignBottom];
type Label = Parameters<typeof i18n>[0];

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
    const patch = (next: Partial<HeaderAttrs>) => {
        setHeaderAttrs(pos, next)(editorView.state, editorView.dispatch);
        refresh();
    };
    const row = (label: string, control: ReactNode) => (
        <div className={b('row')}>
            <span>{label}</span>
            {control}
        </div>
    );
    const toggle = (attr: keyof HeaderAttrs, label: Label) =>
        row(
            i18n(label),
            <Switch
                checked={attrs[attr] === 'true'}
                controlProps={{'aria-label': i18n(label)}}
                onUpdate={(checked) => patch({[attr]: String(checked)})}
            />,
        );
    const select = (
        attr: keyof HeaderAttrs,
        label: Label,
        values: readonly string[],
        prefix: string = attr,
    ) =>
        row(
            i18n(label),
            <Select
                width="max"
                value={[attrs[attr]]}
                aria-label={i18n(label)}
                options={values.map((value) => ({
                    value,
                    content: i18n(`${prefix}_${value}` as Label),
                }))}
                onUpdate={([value]) => patch({[attr]: value})}
            />,
        );
    const actions = current.child(2);
    const updateAction = (
        index: number,
        next: Partial<{text: string; href: string; type: string; color: string}> | null,
    ) => {
        const action = index < actions.childCount ? actions.child(index) : null;
        setHeaderAction(
            pos,
            index,
            next && {
                text: action?.textContent ?? i18n('action'),
                href: String(action?.attrs.href ?? ''),
                type: String(action?.attrs.type ?? 'button'),
                color: String(action?.attrs.color ?? 'brand'),
                ...next,
            },
        )(editorView.state, editorView.dispatch);
        refresh();
    };

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
                    <Button view="flat" aria-label={i18n('close')} onClick={hide}>
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
                {row(
                    i18n('format'),
                    <SegmentedRadioGroup
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
                {row(
                    i18n('vertical'),
                    <SegmentedRadioGroup
                        width="max"
                        value={attrs.vertical}
                        aria-label={i18n('vertical')}
                        options={['top', 'center', 'bottom'].map((value, index) => ({
                            value,
                            title: i18n(value as Label),
                            content: <Icon data={verticalIcons[index]} size={16} />,
                        }))}
                        onUpdate={(vertical) => patch({vertical})}
                    />,
                )}
                {row(
                    i18n('align'),
                    <SegmentedRadioGroup
                        width="max"
                        value={attrs.align}
                        aria-label={i18n('align')}
                        options={['left', 'center', 'right'].map((value, index) => ({
                            value,
                            title: i18n(value as Label),
                            content: <Icon data={horizontalIcons[index]} size={16} />,
                        }))}
                        onUpdate={(align) => patch({align})}
                    />,
                )}
                <details open className={b('section')}>
                    <summary>{i18n('content')}</summary>
                    {toggle(HeaderAttr.Title, 'title')}
                    {toggle(HeaderAttr.Description, 'description')}
                    {select(HeaderAttr.Text, 'text', Object.values(HeaderText))}
                </details>
                <details open className={b('section')}>
                    <summary>{i18n('actions')}</summary>
                    {[0, 1, 2].map((index) => {
                        const action = index < actions.childCount ? actions.child(index) : null;
                        const label = `${i18n('action')} ${index + 1}`;
                        const buttonStyle = action?.attrs.color === 'brand' ? 'brand' : 'normal';
                        return (
                            <div key={label} className={b('action')}>
                                {row(
                                    label,
                                    <Switch
                                        checked={Boolean(action)}
                                        disabled={index > actions.childCount}
                                        controlProps={{'aria-label': label}}
                                        onUpdate={(checked) =>
                                            updateAction(index, checked ? {} : null)
                                        }
                                    />,
                                )}
                                {action && (
                                    <>
                                        {row(
                                            i18n('action_style'),
                                            <Select
                                                width="max"
                                                aria-label={`${label}: ${i18n('action_style')}`}
                                                value={[
                                                    action.attrs.type === 'link'
                                                        ? 'flat'
                                                        : buttonStyle,
                                                ]}
                                                options={['brand', 'normal', 'flat'].map(
                                                    (value) => ({
                                                        value,
                                                        content: i18n(`action_${value}` as Label),
                                                    }),
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
                                                value={action.textContent}
                                                controlProps={{
                                                    'aria-label': `${label}: ${i18n('action_text')}`,
                                                }}
                                                onUpdate={(text) => updateAction(index, {text})}
                                            />,
                                        )}
                                        {row(
                                            i18n('action_href'),
                                            <TextInput
                                                value={String(action.attrs.href)}
                                                controlProps={{
                                                    'aria-label': `${label}: ${i18n('action_href')}`,
                                                }}
                                                onUpdate={(href) => updateAction(index, {href})}
                                            />,
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </details>
                <details open className={b('section')}>
                    <summary>{i18n('background')}</summary>
                    {select(HeaderAttr.Background, 'background', Object.values(HeaderBackground))}
                    {select(HeaderAttr.Fill, 'color', HEADER_FILLS, 'color')}
                    {row(
                        i18n('image'),
                        <Button
                            disabled={!fileUploadHandler}
                            onClick={async () => {
                                if (!fileUploadHandler) return;
                                const result = await uploadHeaderImage(
                                    editorView,
                                    pos,
                                    fileUploadHandler,
                                );
                                if (result === 'failed')
                                    toaster.add({
                                        name: 'header-image-upload',
                                        theme: 'danger',
                                        title: i18n('image_error'),
                                    });
                                refresh();
                            }}
                        >
                            {i18n('image_add')}
                        </Button>,
                    )}
                    {attrs.image &&
                        row(
                            i18n('file'),
                            <Button onClick={() => patch({image: ''})}>
                                {i18n('image_remove')}
                            </Button>,
                        )}
                    {attrs.image && select(HeaderAttr.Layer, 'layer', Object.values(HeaderLayer))}
                </details>
            </div>
        </Popup>
    );
}

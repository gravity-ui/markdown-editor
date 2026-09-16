import {type ReactNode, useRef, useState} from 'react';

import {ChevronDown, LayoutHeader, Link, Picture, Pill, Plus, TrashBin} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';
import {
    Toolbar,
    type ToolbarBaseProps,
    ToolbarButtonView,
    type ToolbarData,
    ToolbarDataType,
} from 'src/toolbar';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderActionType, type HeaderAttrs} from '../../HeaderSpecs';
import {addHeaderAction, removeHeader, setHeaderAttrs} from '../../commands';
import {getHeaderTargets} from '../targets';

import {FillPalette, FillSwatch} from './FillPalette';
import {AppearanceSettings} from './HeaderAppearance';
import {HeaderPopover, type HeaderPopoverHandle, applyHeaderCommand} from './HeaderPopover';
import {ActionsSettings, ImageSettings} from './HeaderSettings';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');
const panelTitles = {
    appearance: 'appearance',
    fill: 'fill',
    image: 'bg.image',
    links: 'cta.links',
} as const;
type Panel = keyof typeof panelTitles;
type Control = {
    title: string;
    preview: ReactNode;
    active: boolean;
    enabled: boolean;
    onClick(): void;
    anchor(element: HTMLButtonElement | null): void;
};

function HeaderControl({control, className}: ToolbarBaseProps<EditorView> & {control?: Control}) {
    if (!control) return null;
    return (
        <ToolbarButtonView
            ref={(element) => {
                control.anchor(element);
                element?.setAttribute('aria-haspopup', 'dialog');
                element?.setAttribute('aria-expanded', String(control.active));
            }}
            title={control.title}
            active={control.active}
            enabled={control.enabled}
            hintWhenDisabled={false}
            disableTooltip={control.active}
            onClick={control.onClick}
            className={b('trigger', [className])}
        >
            <span className={b('control')}>
                {control.preview}
                <Icon data={ChevronDown} size={10} className={b('chevron')} />
            </span>
        </ToolbarButtonView>
    );
}

export type HeaderToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    fileUploadHandler?: FileUploadHandler;
    normalizeUrl: (url: string) => string | null;
};

export function HeaderToolbar({
    node,
    pos,
    editorView,
    fileUploadHandler,
    normalizeUrl,
}: HeaderToolbarProps) {
    const [panel, setPanel] = useState<Panel | null>(null);
    const anchors = useRef<Partial<Record<Panel, HTMLButtonElement | null>>>({});
    const popover = useRef<HeaderPopoverHandle>(null);
    const targets = getHeaderTargets(editorView.state);
    const attrs = node.attrs as HeaderAttrs;
    const focus = () => editorView.focus();
    const update = (patch: Partial<HeaderAttrs>) =>
        applyHeaderCommand(editorView, setHeaderAttrs(pos, patch));
    const close = () => setPanel(null);
    const control = (id: Panel, preview: ReactNode) => ({
        id: `header-${id}`,
        type: ToolbarDataType.ReactComponent as const,
        component: HeaderControl,
        width: id === 'links' ? 70 : 42,
        props: {
            control: {
                title: i18n(panelTitles[id]),
                preview,
                active: panel === id,
                enabled: id !== 'links' || Boolean(targets?.actions.length),
                anchor: (element: HTMLButtonElement | null) => {
                    anchors.current[id] = element;
                },
                onClick: () => {
                    if (panel === id) popover.current?.close('outside');
                    else {
                        popover.current?.close('outside');
                        setPanel(id);
                    }
                },
            } satisfies Control,
        },
    });
    const data: ToolbarData<EditorView> = [
        [
            control('appearance', <Icon data={LayoutHeader} size={16} />),
            control('fill', <FillSwatch value={attrs.fill} />),
            control('image', <Icon data={Picture} size={16} />),
        ],
        [
            {
                id: 'header-cta-add',
                type: ToolbarDataType.ListButton,
                icon: {data: Plus},
                title: i18n('cta.add'),
                data: [
                    {type: HeaderActionType.Button, icon: Pill, title: i18n('cta.type_button')},
                    {type: HeaderActionType.Link, icon: Link, title: i18n('cta.type_link')},
                ].map(({type, icon, title}) => ({
                    id: `header-cta-add-${type}`,
                    icon: {data: icon},
                    title,
                    isActive: () => false,
                    isEnable: () => addHeaderAction(pos, {type})(editorView.state),
                    exec: () => addHeaderAction(pos, {type})(editorView.state, editorView.dispatch),
                })),
            },
            control('links', i18n('cta.links')),
        ],
        [
            {
                id: 'header-remove',
                type: ToolbarDataType.SingleButton,
                icon: {data: TrashBin},
                title: i18n('remove'),
                theme: 'danger',
                isActive: () => false,
                isEnable: () => true,
                exec: () => removeHeader(pos)(editorView.state, editorView.dispatch),
            },
        ],
    ];
    return (
        <>
            <Toolbar
                editor={editorView}
                focus={focus}
                className={b()}
                qa="g-md-toolbar-header"
                data={data}
            />
            {panel && targets && (
                <HeaderPopover
                    key={panel}
                    onClose={close}
                    ref={popover}
                    anchor={anchors.current[panel] ?? null}
                    title={i18n(panelTitles[panel])}
                    editorView={editorView}
                >
                    {panel === 'appearance' && (
                        <AppearanceSettings attrs={attrs} onChange={update} />
                    )}
                    {panel === 'fill' && (
                        <div className={b('palette')}>
                            <FillPalette
                                value={attrs.fill}
                                onSelect={(fill) => {
                                    update({fill});
                                    close();
                                    focus();
                                }}
                            />
                        </div>
                    )}
                    {panel === 'image' && (
                        <ImageSettings
                            targetId={targets.header.id}
                            editorView={editorView}
                            fileUploadHandler={fileUploadHandler}
                            normalizeUrl={normalizeUrl}
                        />
                    )}
                    {panel === 'links' && (
                        <ActionsSettings editorView={editorView} normalizeUrl={normalizeUrl} />
                    )}
                </HeaderPopover>
            )}
        </>
    );
}

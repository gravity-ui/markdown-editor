import {type MouseEvent, useLayoutEffect, useState} from 'react';

import {useFloatingRootContext} from '@floating-ui/react';
import {Copy, Gear, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Popup, useToaster} from '@gravity-ui/uikit';

import type {Serializer} from '#core';
import {Fragment, type Node, Slice} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {headerAt, removeHeader} from '../../commands';

import {HeaderSettings} from './HeaderSettings';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');

export type HeaderToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    anchorElement: HTMLElement;
    fileUploadHandler?: FileUploadHandler;
    serializer: Serializer;
    onSettingsOpenChange: (open: boolean) => void;
    onClose: () => void;
};

export function HeaderToolbar({
    node,
    pos,
    editorView,
    anchorElement,
    fileUploadHandler,
    serializer,
    onSettingsOpenChange,
    onClose,
}: HeaderToolbarProps) {
    const [settingsAnchor, setSettingsAnchor] = useState<HTMLButtonElement | null>(null);
    const toaster = useToaster();
    const context = useFloatingRootContext({
        open: true,
        elements: {reference: editorView.dom, floating: null},
        onOpenChange: (open) => {
            if (!open && !settingsAnchor) onClose();
        },
    });

    useLayoutEffect(() => {
        context.refs.setPositionReference(anchorElement);
    }, [anchorElement, context.refs]);

    const closeSettings = () => {
        settingsAnchor?.focus();
        setSettingsAnchor(null);
        onSettingsOpenChange(false);
    };
    const copy = async () => {
        const current = headerAt(editorView.state.doc, pos);
        if (!current) return;
        const {dom} = editorView.serializeForClipboard(new Slice(Fragment.from(current), 0, 0));
        const text = serializer.serialize(
            editorView.state.schema.topNodeType.create(null, current),
        );
        try {
            if (typeof ClipboardItem === 'undefined') {
                await navigator.clipboard.writeText(text);
            } else {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': new Blob([text], {type: 'text/plain'}),
                        'text/html': new Blob([dom.innerHTML], {type: 'text/html'}),
                    }),
                ]);
            }
        } catch {
            toaster.add({name: 'header-copy', theme: 'danger', title: i18n('copy_error')});
        }
    };

    return (
        <Popup
            open
            className={b('popup')}
            floatingContext={context}
            hasArrow={false}
            placement={['bottom', 'top']}
            offset={8}
            onOpenChange={(open) => {
                if (!open && !settingsAnchor) onClose();
            }}
        >
            <div
                className={b()}
                role="toolbar"
                aria-label={i18n('block_actions')}
                data-qa="g-md-toolbar-header"
            >
                <Button
                    view="flat"
                    size="m"
                    selected={Boolean(settingsAnchor)}
                    title={i18n('settings')}
                    aria-label={i18n('settings')}
                    onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        const next = settingsAnchor ? null : event.currentTarget;
                        setSettingsAnchor(next);
                        onSettingsOpenChange(Boolean(next));
                    }}
                >
                    <Icon data={Gear} size={16} />
                </Button>
                <Button
                    view="flat"
                    size="m"
                    title={i18n('copy')}
                    aria-label={i18n('copy')}
                    onClick={copy}
                >
                    <Icon data={Copy} size={16} />
                </Button>
                <span className={b('separator')} aria-hidden="true" />
                <Button
                    view="flat"
                    size="m"
                    className={b('remove')}
                    title={i18n('remove')}
                    aria-label={i18n('remove')}
                    onClick={() => {
                        removeHeader(pos)(editorView.state, editorView.dispatch);
                        editorView.focus();
                    }}
                >
                    <Icon data={TrashBin} size={16} />
                </Button>
                {settingsAnchor && (
                    <HeaderSettings
                        node={node}
                        pos={pos}
                        editorView={editorView}
                        anchorElement={settingsAnchor}
                        hide={closeSettings}
                        fileUploadHandler={fileUploadHandler}
                    />
                )}
            </div>
        </Popup>
    );
}

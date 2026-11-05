import type {DragEvent} from 'react';

import {Copy, Gear, Grip, TrashBin} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {type Command, NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {Button, Icon} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {openHeaderSettings} from '../Settings';
import {copyHeader, removeHeader} from '../commands';

import './HeaderControls.scss';

const b = cn('header-view');

type HeaderControlsProps = {
    view: EditorView;
    getPos: () => number | undefined;
    block: HTMLElement;
};

export function HeaderControls({view, getPos, block}: HeaderControlsProps) {
    const run = (command: (pos: number) => Command) => () => {
        const pos = getPos();
        if (pos !== undefined) command(pos)(view.state, view.dispatch);
    };

    const startDrag = (event: DragEvent) => {
        const pos = getPos();
        if (pos === undefined) return;
        const selection = NodeSelection.create(view.state.doc, pos);
        view.dispatch(view.state.tr.setSelection(selection));
        const slice = selection.content();
        const {dom, text} = view.serializeForClipboard(slice);
        event.dataTransfer.setData('text/html', dom.innerHTML);
        event.dataTransfer.setData('text/plain', text);
        event.dataTransfer.setDragImage(block, 0, 0);
        // The drop handler of the view moves the selected block.
        view.dragging = {slice, move: true};
    };

    return (
        <>
            <div
                className={b('handle')}
                draggable
                onDragStart={startDrag}
                // A drop outside the editor leaves the dragged slice behind.
                onDragEnd={() => {
                    view.dragging = null;
                }}
            >
                <Icon data={Grip} size={16} />
            </div>
            <div className={b('toolbar')} role="toolbar">
                <Button
                    className={b('settings')}
                    view="flat"
                    size="m"
                    aria-label={i18n('settings')}
                    onClick={run(openHeaderSettings)}
                >
                    <Icon data={Gear} size={16} />
                </Button>
                <Button view="flat" size="m" aria-label={i18n('copy')} onClick={run(copyHeader)}>
                    <Icon data={Copy} size={16} />
                </Button>
                <div className={b('divider')} />
                <Button
                    view="flat-danger"
                    size="m"
                    aria-label={i18n('remove')}
                    onClick={run(removeHeader)}
                >
                    <Icon data={TrashBin} size={16} />
                </Button>
            </div>
        </>
    );
}

import {useCallback, useMemo, useState} from 'react';

import {Copy, Gear, TrashBin} from '@gravity-ui/icons';
import {useLatest} from 'react-use';

import type {Node} from '#pm/model';
import {NodeSelection} from '#pm/state';
import type {EditorView} from '#pm/view';
import {i18n} from 'src/i18n/button';
import {typedMemo} from 'src/react-utils/memo';
import {Toolbar, type ToolbarData, ToolbarDataType} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';
import {removeNode} from 'src/utils/remove-node';

import {ButtonSettings} from './ButtonSettings';

import './ButtonToolbar.scss';

const ToolbarMemoized = typedMemo(Toolbar);

const isEnable = () => true;

export type ButtonToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
};

export function ButtonToolbar({node, pos, editorView}: ButtonToolbarProps) {
    const posRef = useLatest(pos);
    const nodeRef = useLatest(node);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const onFocus = useCallback(() => editorView.focus(), [editorView]);
    const closeSettings = useCallback(() => setSettingsOpen(false), []);

    const toolbarData = useMemo<ToolbarData<EditorView>>(
        () => [
            [
                {
                    id: 'button-settings',
                    icon: {data: Gear},
                    title: () => i18n('settings'),
                    type: ToolbarDataType.SingleButton,
                    isActive: () => settingsOpen,
                    isEnable,
                    // Повторный клик не закрывает попап: его закрывает нажатие вне попапа.
                    exec: () => setSettingsOpen(true),
                },
                {
                    id: 'button-duplicate',
                    icon: {data: Copy},
                    title: () => i18n('duplicate'),
                    type: ToolbarDataType.SingleButton,
                    isActive: () => false,
                    isEnable,
                    exec: (view) => {
                        const at = posRef.current + nodeRef.current.nodeSize;
                        const tr = view.state.tr.insert(at, nodeRef.current);
                        view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, at)));
                    },
                },
            ],
            [
                {
                    id: 'button-remove',
                    icon: {data: TrashBin},
                    title: () => i18n('remove'),
                    type: ToolbarDataType.SingleButton,
                    theme: 'danger',
                    isActive: () => false,
                    isEnable,
                    exec: (view) =>
                        removeNode({
                            pos: posRef.current,
                            node: nodeRef.current,
                            tr: view.state.tr,
                            dispatch: view.dispatch,
                        }),
                },
            ],
        ],
        [nodeRef, posRef, settingsOpen],
    );

    return (
        <ToolbarWrapToContext editor={editorView}>
            <ToolbarMemoized
                editor={editorView}
                focus={onFocus}
                className="g-md-button-toolbar"
                qa="g-md-toolbar-button"
                data={toolbarData}
            />
            {settingsOpen && (
                <ButtonSettings
                    node={node}
                    pos={pos}
                    editorView={editorView}
                    onClose={closeSettings}
                />
            )}
        </ToolbarWrapToContext>
    );
}

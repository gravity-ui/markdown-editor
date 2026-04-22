import {useCallback, useMemo} from 'react';

import {CircleInfo, TrashBin} from '@gravity-ui/icons';
import {useLatest} from 'react-use';

import type {Node} from '#pm/model';
import type {Transaction} from '#pm/state';
import type {EditorView} from '#pm/view';
import {i18n} from 'src/i18n/yfm-note';
import {typedMemo} from 'src/react-utils/memo';
import {Toolbar, type ToolbarData, ToolbarDataType} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';
import {removeNode} from 'src/utils/remove-node';

import {NoteAttrs} from '../../const';

import './YfmNoteToolbar.scss';

const ToolbarMemoized = typedMemo(Toolbar);

enum YfmNoteType {
    tip = 'tip',
    info = 'info',
    warning = 'warning',
    alert = 'alert',
}

const isEnable = () => true;

const changeType: (
    type: YfmNoteType,
) => (params: {
    node: Node;
    pos: number;
    dispatch: EditorView['dispatch'];
    tr: Transaction;
}) => void =
    (type) =>
    ({node, pos, dispatch, tr}) => {
        dispatch(
            tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                [NoteAttrs.Class]: `yfm-note yfm-accent-${type}`,
                [NoteAttrs.Type]: type,
            }),
        );
    };

export type YfmNoteToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
};

export function YfmNoteToolbar({pos, node, editorView}: YfmNoteToolbarProps) {
    const posRef = useLatest(pos);
    const nodeRef = useLatest(node);

    const onFocus = useCallback(() => {
        editorView.focus();
    }, [editorView]);

    const toolbarData = useMemo<ToolbarData<EditorView>>(() => {
        return [
            [YfmNoteType.info, YfmNoteType.tip, YfmNoteType.warning, YfmNoteType.alert].map(
                (type) => ({
                    id: `note-type-${type}`,
                    icon: {data: CircleInfo},
                    title: i18n(type),
                    type: ToolbarDataType.SingleButton,
                    isActive: () => nodeRef.current.attrs[NoteAttrs.Type] === type,
                    isEnable,
                    exec: (view) =>
                        changeType(type)({
                            pos: posRef.current,
                            node: nodeRef.current,
                            tr: view.state.tr,
                            dispatch: view.dispatch,
                        }),
                }),
            ),
            [
                {
                    id: 'note-remove',
                    icon: {data: TrashBin},
                    title: i18n('remove'),
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
        ];
    }, [nodeRef, posRef]);

    return (
        <ToolbarWrapToContext editor={editorView}>
            <ToolbarMemoized
                editor={editorView}
                focus={onFocus}
                // the yfm class allows to access css variables
                // https://github.com/diplodoc-platform/transform/blob/master/src/scss/_common.scss#L17
                className="yfm g-md-yfm-note-toolbar"
                qa="g-md-toolbar-yfm-note"
                data={toolbarData}
            />
        </ToolbarWrapToContext>
    );
}

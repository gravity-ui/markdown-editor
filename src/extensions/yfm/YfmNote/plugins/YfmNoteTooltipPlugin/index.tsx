import {CircleInfo, TrashBin} from '@gravity-ui/icons';
import type {Node, Schema} from 'prosemirror-model';
import {Plugin, type Transaction} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {ExtensionDeps} from '../../../../../core';
import {i18n} from '../../../../../i18n/yfm-note';
import {BaseTooltipPluginView} from '../../../../../plugins/BaseTooltip';
import {Toolbar, ToolbarDataType} from '../../../../../toolbar';
import {removeNode} from '../../../../../utils/remove-node';
import {noteType} from '../../../index';

import './index.scss';

enum YfmNoteType {
    tip = 'tip',
    info = 'info',
    warning = 'warning',
    alert = 'alert',
}

const isEnable = () => true;
const isActive = () => false;

const changeType: (
    type: YfmNoteType,
) => (params: {
    schema: Schema;
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
                class: `yfm-note yfm-accent-${type}`,
                'note-type': type,
            }),
        );
    };

export const yfmNoteTooltipPlugin = ({actions, schema}: ExtensionDeps) =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'yfm-note-tooltip',
                nodeType: noteType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (view, {node, pos}) => (
                    <Toolbar
                        editor={actions}
                        focus={() => view.focus()}
                        // the yfm class allows to access css variables
                        // https://github.com/diplodoc-platform/transform/blob/master/src/scss/_common.scss#L17
                        className="yfm g-md-yfm-note-toolbar"
                        data={[
                            [
                                YfmNoteType.info,
                                YfmNoteType.tip,
                                YfmNoteType.warning,
                                YfmNoteType.alert,
                            ].map((type) => ({
                                id: `note-type-${type}`,
                                icon: {data: CircleInfo},
                                title: i18n(type),
                                type: ToolbarDataType.SingleButton,
                                isActive,
                                isEnable,
                                exec: () =>
                                    changeType(type)({
                                        schema,
                                        pos: pos,
                                        node: node,
                                        tr: view.state.tr,
                                        dispatch: view.dispatch.bind(view),
                                    }),
                            })),
                            [
                                {
                                    id: 'note-remove',
                                    icon: {data: TrashBin},
                                    title: i18n('remove'),
                                    type: ToolbarDataType.SingleButton,
                                    isActive,
                                    isEnable,
                                    exec: () =>
                                        removeNode({
                                            pos: pos,
                                            node: node,
                                            tr: view.state.tr,
                                            dispatch: view.dispatch.bind(view),
                                        }),
                                },
                            ],
                        ]}
                    />
                ),
            });
        },
    });

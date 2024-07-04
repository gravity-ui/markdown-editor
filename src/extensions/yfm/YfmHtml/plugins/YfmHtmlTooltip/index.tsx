import React from 'react';

import {Pencil, TrashBin} from '@gravity-ui/icons';
import {Node, Schema} from 'prosemirror-model';
import {Plugin, Transaction} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {ExtensionDeps} from '../../../../../core';

const i18n = (value: string) => value; // import {i18n} from '../../../../../i18n/yfm-html';

import {BaseTooltipPluginView} from '../../../../../plugins/BaseTooltip';
import {Toolbar, ToolbarDataType} from '../../../../../toolbar';
import {removeNode} from '../../../../../utils/remove-node';
import {YfmHtmlConsts} from '../../YfmHtmlSpecs/const';

import './index.scss';

enum YfmHtmlType {
    tip = 'tip',
    info = 'info',
    warning = 'warning',
    alert = 'alert',
}

const isEnable = () => true;
const isActive = () => false;

const changeMode: () => (params: {
    schema: Schema;
    node: Node;
    pos: number;
    dispatch: EditorView['dispatch'];
    tr: Transaction;
}) => void = () => () => {
    (window as any).yfmHtmlEditable = 'true';
};

export const yfmHtmlTooltipPlugin = ({actions, schema}: ExtensionDeps) =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'yfm-html-tooltip',
                nodeType: YfmHtmlConsts.nodeType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (view, {node, pos}) => (
                    <Toolbar
                        editor={actions}
                        focus={() => view.focus()}
                        className="g-md-yfm-html-toolbar"
                        data={[
                            [YfmHtmlType.info].map((type) => ({
                                id: `html-type-${type}`,
                                icon: {data: Pencil},
                                title: i18n(type),
                                type: ToolbarDataType.SingleButton,
                                isActive,
                                isEnable,
                                exec: () =>
                                    changeMode()({
                                        schema,
                                        pos: pos,
                                        node: node,
                                        tr: view.state.tr,
                                        dispatch: view.dispatch.bind(view),
                                    }),
                            })),
                            [
                                {
                                    id: 'html-remove',
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

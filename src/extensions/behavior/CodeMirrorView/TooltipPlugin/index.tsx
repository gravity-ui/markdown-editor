import React from 'react';

import {TrashBin} from '@gravity-ui/icons';
import {Select, SelectOption} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {codeBlockType} from '../../../../extensions/markdown';
import {i18n} from '../../../../i18n/codeblock';
import {i18n as i18nPlaceholder} from '../../../../i18n/placeholder';
import {BaseTooltipPluginView} from '../../../../plugins/BaseTooltip';
import {Toolbar, ToolbarDataType} from '../../../../toolbar';
import {removeNode} from '../../../../utils/remove-node';
import {langAttr} from '../const';

import './TooltipView.scss';

type CodeMenuProps = {
    view: EditorView;
    pos: number;
    node: Node;
    selectItems: SelectOption[];
    mapping: Record<string, string>;
};

const CodeMenu: React.FC<CodeMenuProps> = ({view, pos, node, selectItems, mapping}) => {
    const lang = node.attrs[langAttr];
    const value = mapping[lang] ?? lang;

    const handleClick = (type: string) => {
        view.focus();
        if (type === value) return;

        view.dispatch(
            view.state.tr.setNodeMarkup(pos, null, {
                [langAttr]: type,
            }),
        );
    };

    return (
        <Select
            size="m"
            width="max"
            value={[value]}
            onUpdate={(v) => handleClick(v[0])}
            options={selectItems}
            filterable
            filterPlaceholder={i18nPlaceholder('select_filter')}
            popupClassName="ye-code-block__select-popup"
            className="ye-code-block__select-button"
            renderEmptyOptions={() => (
                <div className="ye-code-block__select-empty">{i18n('empty_option')}</div>
            )}
        />
    );
};

export const codeLangSelectTooltipViewCreator = (
    view: EditorView,
    langItems: SelectOption[],
    mapping: Record<string, string> = {},
) => {
    return new BaseTooltipPluginView(view, {
        idPrefix: 'code-block-tooltip',
        nodeType: codeBlockType(view.state.schema),
        popupPlacement: ['bottom', 'top'],
        content: (view, {node, pos}) => (
            <Toolbar
                editor={{}}
                focus={() => view.focus()}
                className="ye-code-block-toolbar"
                data={[
                    [
                        {
                            id: 'code-block-type',
                            type: ToolbarDataType.ReactComponent,
                            component: () => (
                                <CodeMenu
                                    view={view}
                                    pos={pos}
                                    node={node}
                                    selectItems={langItems}
                                    mapping={mapping}
                                />
                            ),
                            width: 28,
                        },
                    ],
                    [
                        {
                            id: 'code-block-remove',
                            icon: {data: TrashBin},
                            title: i18n('remove'),
                            type: ToolbarDataType.SingleButton,
                            isActive: () => false,
                            isEnable: () => true,
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
};

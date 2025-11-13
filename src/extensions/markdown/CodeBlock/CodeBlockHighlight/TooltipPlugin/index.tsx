import type {ChangeEventHandler} from 'react';

import {TrashBin} from '@gravity-ui/icons';
import {Checkbox, Select, type SelectOption} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {i18n} from '../../../../../i18n/codeblock';
import {i18n as i18nPlaceholder} from '../../../../../i18n/placeholder';
import {BaseTooltipPluginView} from '../../../../../plugins/BaseTooltip';
import {Toolbar, ToolbarDataType} from '../../../../../toolbar';
import {removeNode} from '../../../../../utils/remove-node';
import {CodeBlockNodeAttr, codeBlockType} from '../../CodeBlockSpecs';

import './TooltipView.scss';

type CodeMenuProps = {
    view: EditorView;
    pos: number;
    node: Node;
    selectItems: SelectOption[];
    mapping: Record<string, string>;
};

const CodeMenu: React.FC<CodeMenuProps> = ({view, pos, node, selectItems, mapping}) => {
    const lang = node.attrs[CodeBlockNodeAttr.Lang];
    const showLineNumbers = node.attrs[CodeBlockNodeAttr.ShowLineNumbers];
    const value = mapping[lang] ?? lang;

    const handleClick = (type: string) => {
        view.focus();
        if (type === value) return;

        view.dispatch(
            view.state.tr.setNodeMarkup(pos, null, {
                [CodeBlockNodeAttr.Lang]: type,
                [CodeBlockNodeAttr.ShowLineNumbers]: showLineNumbers,
            }),
        );
    };

    return (
        <Select
            size="m"
            width="max"
            disablePortal
            value={[value]}
            onUpdate={(v) => handleClick(v[0])}
            options={selectItems}
            filterable
            filterPlaceholder={i18nPlaceholder('select_filter')}
            popupClassName="g-md-code-block__select-popup"
            className="g-md-code-block__select-button"
            renderEmptyOptions={() => (
                <div className="g-md-code-block__select-empty">{i18n('empty_option')}</div>
            )}
            // TODO: in onOpenChange return focus to view.dom after press Esc in Select
            // after https://github.com/gravity-ui/uikit/issues/2075
        />
    );
};

type ShowLineNumbersProps = {
    view: EditorView;
    pos: number;
    node: Node;
};

const ShowLineNumbers: React.FC<ShowLineNumbersProps> = ({view, pos, node}) => {
    const lang = node.attrs[CodeBlockNodeAttr.Lang];
    const showLineNumbers = node.attrs[CodeBlockNodeAttr.ShowLineNumbers] === 'true';

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        view.dispatch(
            view.state.tr.setNodeMarkup(pos, null, {
                [CodeBlockNodeAttr.Lang]: lang,
                [CodeBlockNodeAttr.ShowLineNumbers]: event.target.checked ? 'true' : undefined,
            }),
        );
    };

    return (
        <Checkbox
            checked={showLineNumbers}
            className="g-md-code-block__show-line-numbers"
            content={i18n('show_line_numbers')}
            onChange={handleChange}
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
                className="g-md-code-block-toolbar"
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
                            id: 'code-block-showlinenumbers',
                            type: ToolbarDataType.ReactComponent,
                            component: () => <ShowLineNumbers view={view} pos={pos} node={node} />,
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

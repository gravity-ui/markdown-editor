import {
    ListOl as LineNumbersIcon,
    TrashBin as RemoveIcon,
    ArrowUturnCwLeft as WrappingIcon,
} from '@gravity-ui/icons';
import {ClipboardButton, Select, type SelectOption} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/codeblock';
import {i18n as i18nPlaceholder} from 'src/i18n/placeholder';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';
import {Toolbar, ToolbarDataType, type ToolbarGroupItemData} from 'src/toolbar';
import {removeNode} from 'src/utils/remove-node';
import {isTruthy} from 'src/utils/truthy';

import {CodeBlockNodeAttr, codeBlockType} from '../../CodeBlockSpecs';
import {PlainTextLang} from '../const';
import {isNodeHasLineWrapping} from '../plugins/codeBlockLineWrappingPlugin';

import {isLineNumbersVisible, toggleLineNumbers, toggleLineWrapping} from './utils';

import './TooltipView.scss';

const bCodeBlock = cn('code-block');
const bToolbar = cn('code-block-toolbar');

type CodeMenuProps = {
    view: EditorView;
    pos: number;
    node: Node;
    selectItems: SelectOption[];
    mapping: Record<string, string>;
};

const CodeMenu: React.FC<CodeMenuProps> = ({view, pos, node, selectItems, mapping}) => {
    const lang = node.attrs[CodeBlockNodeAttr.Lang];
    const value = mapping[lang] || lang || PlainTextLang;

    const handleClick = (type: string) => {
        view.focus();
        if (type === value) return;

        view.dispatch(view.state.tr.setNodeAttribute(pos, CodeBlockNodeAttr.Lang, type));
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
            popupClassName={bCodeBlock('select-popup')}
            className={bCodeBlock('select-button')}
            renderEmptyOptions={() => (
                <div className={bCodeBlock('select-empty')}>{i18n('empty_option')}</div>
            )}
            // TODO: in onOpenChange return focus to view.dom after press Esc in Select
            // after https://github.com/gravity-ui/uikit/issues/2075
        />
    );
};

type Options = {
    showCodeWrapping: boolean;
    showLineNumbers: boolean;
};

export const codeLangSelectTooltipViewCreator = (
    view: EditorView,
    langItems: SelectOption[],
    mapping: Record<string, string> = {},
    {showCodeWrapping, showLineNumbers}: Options,
) => {
    return new BaseTooltipPluginView(view, {
        idPrefix: 'code-block-tooltip',
        nodeType: codeBlockType(view.state.schema),
        popupPlacement: ['bottom', 'top'],
        content: (view, {node, pos}, _onChange, _forceEdit, _onOutsideClick, rerender) => {
            return (
                <Toolbar
                    editor={{}}
                    focus={() => view.focus()}
                    className={bToolbar()}
                    data={[
                        [
                            langItems.length > 0 &&
                                ({
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
                                } satisfies ToolbarGroupItemData<{}>),
                            showCodeWrapping &&
                                ({
                                    id: 'code-block-wrapping',
                                    icon: {data: WrappingIcon},
                                    title: i18n('code_wrapping'),
                                    type: ToolbarDataType.SingleButton,
                                    isActive: () => isNodeHasLineWrapping(view.state, pos),
                                    isEnable: () => true,
                                    exec: () => {
                                        toggleLineWrapping({
                                            pos,
                                            node,
                                            state: view.state,
                                            dispatch: view.dispatch,
                                        });
                                        // forcing rerender because editor's toolbar isn't updated when the decorations change
                                        rerender?.();
                                    },
                                } satisfies ToolbarGroupItemData<{}>),
                            showLineNumbers &&
                                ({
                                    id: 'code-block-linenumbers',
                                    icon: {data: LineNumbersIcon},
                                    title: i18n('show_line_numbers'),
                                    type: ToolbarDataType.SingleButton,
                                    isActive: () => isLineNumbersVisible(node),
                                    isEnable: () => true,
                                    exec: () =>
                                        toggleLineNumbers({
                                            pos,
                                            node,
                                            state: view.state,
                                            dispatch: view.dispatch,
                                        }),
                                } satisfies ToolbarGroupItemData<{}>),
                            {
                                id: 'code-block-copy',
                                type: ToolbarDataType.ReactNodeFn,
                                width: 28,
                                content: () => <ClipboardButton text={node.textContent} />,
                            } satisfies ToolbarGroupItemData<{}>,
                        ].filter(isTruthy),
                        [
                            {
                                id: 'code-block-remove',
                                icon: {data: RemoveIcon},
                                title: i18n('remove'),
                                theme: 'danger',
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
            );
        },
    });
};

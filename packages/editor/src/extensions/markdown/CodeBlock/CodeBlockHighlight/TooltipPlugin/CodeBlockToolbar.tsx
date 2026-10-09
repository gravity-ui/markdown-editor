import {useCallback, useMemo} from 'react';

import {
    ListOl as LineNumbersIcon,
    TrashBin as RemoveIcon,
    ArrowUturnCwLeft as WrappingIcon,
} from '@gravity-ui/icons';
import {ClipboardButton, type SelectOption} from '@gravity-ui/uikit';
import {useLatest} from 'react-use';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/codeblock';
import {typedMemo} from 'src/react-utils/memo';
import {Toolbar, type ToolbarData, ToolbarDataType, type ToolbarGroupItemData} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';
import {removeNode} from 'src/utils/remove-node';
import {isTruthy} from 'src/utils/truthy';

import {CodeBlockNodeAttr} from '../../CodeBlockSpecs';
import {isNodeHasLineWrapping} from '../plugins/codeBlockLineWrappingPlugin';

import {CodeLangSelect} from './CodeLangSelect';
import {isLineNumbersVisible, toggleLineNumbers, toggleLineWrapping} from './utils';

const bToolbar = cn('code-block-toolbar');
const ToolbarMemoized = typedMemo(Toolbar);

export type CodeBlockToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    langItems: SelectOption[];
    mapping: Record<string, string>;
    showCodeWrapping: boolean;
    showLineNumbers: boolean;
    rerenderTooltip?: () => void;
};

export function CodeBlockToolbar({
    node,
    pos,
    editorView,
    langItems,
    mapping,
    showCodeWrapping,
    showLineNumbers,
    rerenderTooltip,
}: CodeBlockToolbarProps) {
    const posRef = useLatest(pos);
    const nodeRef = useLatest(node);

    const onFocus = useCallback(() => {
        editorView.focus();
    }, [editorView]);

    const toolbarData = useMemo<ToolbarData<EditorView>>(() => {
        const copyText = () => nodeRef.current.textContent;
        const focus = () => editorView.focus();
        const onLangChange = (value: string) => {
            editorView.dispatch(
                editorView.state.tr.setNodeAttribute(posRef.current, CodeBlockNodeAttr.Lang, value),
            );
        };

        return [
            [
                langItems.length > 0 &&
                    ({
                        id: 'code-block-type',
                        type: ToolbarDataType.ReactComponent,
                        component: () => (
                            <CodeLangSelect
                                focus={focus}
                                onChange={onLangChange}
                                lang={nodeRef.current.attrs[CodeBlockNodeAttr.Lang]}
                                selectItems={langItems}
                                mapping={mapping}
                            />
                        ),
                        width: 28,
                    } satisfies ToolbarGroupItemData<EditorView>),
                showCodeWrapping &&
                    ({
                        id: 'code-block-wrapping',
                        icon: {data: WrappingIcon},
                        title: i18n('code_wrapping'),
                        type: ToolbarDataType.SingleButton,
                        isActive: (view) => isNodeHasLineWrapping(view.state, posRef.current),
                        isEnable: () => true,
                        exec: (view) => {
                            toggleLineWrapping({
                                pos: posRef.current,
                                node: nodeRef.current,
                                state: view.state,
                                dispatch: view.dispatch,
                            });
                            // forcing rerender because editor's toolbar isn't updated when the decorations change
                            rerenderTooltip?.();
                        },
                    } satisfies ToolbarGroupItemData<EditorView>),
                showLineNumbers &&
                    ({
                        id: 'code-block-linenumbers',
                        icon: {data: LineNumbersIcon},
                        title: i18n('show_line_numbers'),
                        type: ToolbarDataType.SingleButton,
                        isActive: () => isLineNumbersVisible(nodeRef.current),
                        isEnable: () => true,
                        exec: (view) => {
                            toggleLineNumbers({
                                pos: posRef.current,
                                node: nodeRef.current,
                                state: view.state,
                                dispatch: view.dispatch,
                            });
                        },
                    } satisfies ToolbarGroupItemData<EditorView>),
                {
                    id: 'code-block-copy',
                    type: ToolbarDataType.ReactNodeFn,
                    width: 28,
                    content: () => <ClipboardButton text={copyText} />,
                    noRerenderOnUpdate: true,
                } satisfies ToolbarGroupItemData<EditorView>,
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
    }, [
        editorView,
        langItems,
        mapping,
        nodeRef,
        posRef,
        rerenderTooltip,
        showCodeWrapping,
        showLineNumbers,
    ]);

    return (
        <ToolbarWrapToContext editor={editorView}>
            <ToolbarMemoized
                editor={editorView}
                focus={onFocus}
                className={bToolbar()}
                data={toolbarData}
            />
        </ToolbarWrapToContext>
    );
}

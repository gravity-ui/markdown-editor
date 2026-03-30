import {useEffect, useMemo, useState} from 'react';

import {Popup, type PopupPlacement, type PopupProps, sp} from '@gravity-ui/uikit';

import type {ActionStorage} from '#core';
import type {EditorView} from '#pm/view';
import {isFunction} from 'src/lodash';
import {typedMemo} from 'src/react-utils/memo';
import {Toolbar, type ToolbarData, type ToolbarProps} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';

import type {ContextConfig} from './types';

const ToolbarMemoized = typedMemo(Toolbar);
const KEY_SEP = '|||';

export type TextSelectionTooltipProps = Pick<
    ToolbarProps<ActionStorage>,
    'onClick' | 'editor' | 'focus'
> & {
    config: ContextConfig;
    editorView: EditorView;
    popupPlacement: PopupPlacement;
    popupAnchor: PopupProps['anchorElement'];
    popupOnOpenChange: PopupProps['onOpenChange'];
};

export const TextSelectionTooltip: React.FC<TextSelectionTooltipProps> =
    function TextSelectionTooltip({
        popupAnchor,
        popupPlacement,
        popupOnOpenChange,

        config,
        focus,
        editor,
        onClick,
        editorView,
    }) {
        const [conditionKey, setConditionKey] = useState(() =>
            calcConditionKey(config, editor, editorView),
        );

        useEffect(() => {
            const newKey = calcConditionKey(config, editor, editorView);
            if (conditionKey !== newKey) setConditionKey(newKey);
        });

        const toolbarData = useMemo<ToolbarData<ActionStorage>>(() => {
            const results = conditionKey.split(KEY_SEP);
            let idx = 0;
            return config
                .map((groupData) => groupData.filter(() => results[idx++] === 'true'))
                .filter((groupData) => Boolean(groupData.length));
        }, [config, conditionKey]);

        return (
            <Popup
                open
                className={sp({py: 1, px: 2})}
                placement={popupPlacement}
                anchorElement={popupAnchor}
                onOpenChange={popupOnOpenChange}
            >
                <ToolbarWrapToContext editor={editor}>
                    <ToolbarMemoized
                        focus={focus}
                        editor={editor}
                        onClick={onClick}
                        data={toolbarData}
                        qa="g-md-toolbar-selection"
                    />
                </ToolbarWrapToContext>
            </Popup>
        );
    };

function calcConditionKey(
    config: ContextConfig,
    editor: ActionStorage,
    editorView: EditorView,
): string {
    return config
        .flatMap((groupData) =>
            groupData.map((item) => {
                const {condition} = item;
                if (condition === 'enabled') return item.isEnable(editor);
                if (isFunction(condition)) return condition(editorView.state);
                return true;
            }),
        )
        .join(KEY_SEP);
}

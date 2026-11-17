import {Popup, type PopupPlacement, type PopupProps, sp} from '@gravity-ui/uikit';

import type {ActionStorage} from '#core';
import {typedMemo} from 'src/react-utils/memo';
import {Toolbar, type ToolbarData, type ToolbarProps} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';

const ToolbarMemoized = typedMemo(Toolbar);

export type TextSelectionTooltipProps = Pick<
    ToolbarProps<ActionStorage>,
    'onClick' | 'editor' | 'focus'
> & {
    toolbarData: ToolbarData<ActionStorage>;
    popupPlacement: PopupPlacement;
    popupAnchor: PopupProps['anchorElement'];
    popupOnOpenChange: PopupProps['onOpenChange'];
};

export const TextSelectionTooltip: React.FC<TextSelectionTooltipProps> =
    function TextSelectionTooltip({
        popupAnchor,
        popupPlacement,
        popupOnOpenChange,

        toolbarData,
        focus,
        editor,
        onClick,
    }) {
        return (
            <Popup
                open
                className={sp({p: '0.5'})}
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

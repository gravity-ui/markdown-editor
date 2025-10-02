import {useLayoutEffect, useRef} from 'react';

import type {QAProps} from '@gravity-ui/uikit';
import {useUpdate} from 'react-use';

import {LAYOUT_MAP} from 'src/common/layoutMap';

import type {ClassNameProps} from '../classname';
import {i18n} from '../i18n/menubar';
import {useSticky} from '../react-utils/useSticky';
import {FlexToolbar, type ToolbarData, type ToolbarDisplay, type ToolbarItemData} from '../toolbar';

import type {EditorInt} from './Editor';
import {stickyCn} from './sticky';
import type {MarkdownEditorMode} from './types';

export type ToolbarViewProps<T> = ClassNameProps &
    QAProps & {
        editor: EditorInt;
        editorMode: MarkdownEditorMode;
        toolbarEditor: T;
        toolbarFocus: () => void;
        toolbarConfig: ToolbarData<T>;
        settingsVisible?: boolean;
        hiddenActionsConfig?: ToolbarItemData<T>[];
        children?: React.ReactNode;
        stickyToolbar: boolean;
        toolbarDisplay?: ToolbarDisplay;
    };

export function ToolbarView<T>({
    editor,
    editorMode,
    toolbarEditor,
    toolbarFocus,
    toolbarConfig,
    toolbarDisplay,
    hiddenActionsConfig,
    settingsVisible,
    className,
    children,
    stickyToolbar,
    qa,
}: ToolbarViewProps<T>) {
    const rerender = useUpdate();
    useLayoutEffect(() => {
        editor.on('rerender-toolbar', rerender);
        return () => {
            editor.off('rerender-toolbar', rerender);
        };
    }, [editor, rerender]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const isStickyActive = useSticky(wrapperRef) && stickyToolbar;

    const mobile = editor.mobile;

    return (
        <div
            data-qa={qa}
            ref={wrapperRef}
            className={stickyCn.toolbar(
                {
                    withSettings: settingsVisible,
                    stickyActive: isStickyActive,
                    isSticky: stickyToolbar,
                },
                [className],
            )}
            data-layout={LAYOUT_MAP.STICKY_TOOLBAR}
        >
            <FlexToolbar
                data={toolbarConfig}
                hiddenActions={hiddenActionsConfig}
                editor={toolbarEditor}
                focus={toolbarFocus}
                dotsTitle={i18n('more_action')}
                onClick={(id, attrs) => editor.emit('toolbar-action', {id, attrs, editorMode})}
                display={toolbarDisplay}
                disableTooltip={mobile}
                disableHotkey={mobile}
                disablePreview={mobile}
            />
            {children}
        </div>
    );
}

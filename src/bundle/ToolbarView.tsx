import React, {useLayoutEffect, useRef} from 'react';

import {useUpdate} from 'react-use';

import {ClassNameProps} from '../classname';
import {i18n} from '../i18n/menubar';
import {useSticky} from '../react-utils/useSticky';
import {FlexToolbar, ToolbarData, ToolbarItemData} from '../toolbar';

import type {EditorInt, EditorType} from './Editor';
import {stickyCn} from './sticky';

export type ToolbarViewProps<T> = ClassNameProps & {
    editor: EditorInt;
    editorType: EditorType;
    toolbarEditor: T;
    toolbarFocus: () => void;
    toolbarConfig: ToolbarData<T>;
    settingsVisible?: boolean;
    hiddenActionsConfig?: ToolbarItemData<T>[];
    children?: React.ReactNode;
    stickyToolbar: boolean;
};

export function ToolbarView<T>({
    editor,
    editorType,
    toolbarEditor,
    toolbarFocus,
    toolbarConfig,
    hiddenActionsConfig,
    settingsVisible,
    className,
    children,
    stickyToolbar,
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

    return (
        <div
            ref={wrapperRef}
            className={stickyCn.toolbar(
                {
                    withSettings: settingsVisible,
                    stickyActive: isStickyActive,
                    isSticky: stickyToolbar,
                },
                [className],
            )}
        >
            <FlexToolbar
                data={toolbarConfig}
                hiddenActions={hiddenActionsConfig}
                editor={toolbarEditor}
                focus={toolbarFocus}
                dotsTitle={i18n('more_action')}
                onClick={(id, attrs) => editor.emit('toolbar-action', {id, attrs, editorType})}
            />
            {children}
        </div>
    );
}

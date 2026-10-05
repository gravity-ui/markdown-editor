import {type ComponentProps, useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import {LAYOUT} from 'src/common/layout';
import {typedMemo} from 'src/react-utils/memo';
import {EventEmitter} from 'src/utils';

import type {ClassNameProps} from '../classname';
import {i18n} from '../i18n/menubar';
import {useSticky} from '../react-utils/useSticky';
import {
    FlexToolbar,
    type FlexToolbarProps,
    type ToolbarData,
    type ToolbarDisplay,
    type ToolbarItemData,
    ToolbarProvider,
} from '../toolbar';

import type {EditorInt} from './Editor';
import {stickyCn} from './sticky';
import {resourceReplacementToolbarStatus} from './toolbar/ResourceReplacementStatus';
import type {MarkdownEditorMode} from './types';

const MemoizedFlexibleToolbar = typedMemo(FlexToolbar);

type ToolbarProviderValue = NonNullable<ComponentProps<typeof ToolbarProvider>['value']>;

export type ToolbarViewProps<T> = ClassNameProps &
    QAProps & {
        editor: EditorInt;
        editorMode: MarkdownEditorMode;
        toolbarEditor: T;
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
    toolbarConfig,
    toolbarDisplay,
    hiddenActionsConfig,
    settingsVisible,
    className,
    children,
    stickyToolbar,
    qa,
}: ToolbarViewProps<T>) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isStickyActive = useSticky(wrapperRef) && stickyToolbar;

    const mobile = editor.mobile;
    const [resourceReplacementPending, setResourceReplacementPending] = useState(
        () => editor.getPendingResourceReplacements().length > 0,
    );

    const clickHandle = useCallback<NonNullable<FlexToolbarProps<T>['onClick']>>(
        (id, attrs) => editor.emit('toolbar-action', {id, attrs, editorMode}),
        [editor, editorMode],
    );

    const toolbarProviderValue = useMemo(
        () =>
            ({
                editor: toolbarEditor,
                eventBus: new EventEmitter<{update: null}>(),
            }) satisfies ToolbarProviderValue,
        [toolbarEditor],
    );

    const handleFocus = useCallback(() => {
        editor.focus();
    }, [editor]);

    useLayoutEffect(() => {
        const updatePending = () => {
            setResourceReplacementPending(editor.getPendingResourceReplacements().length > 0);
        };

        const onRerender = () => {
            toolbarProviderValue.eventBus.emit('update', null);
            updatePending();
        };

        editor.on('rerender-toolbar', onRerender);
        updatePending();

        return () => {
            editor.off('rerender-toolbar', onRerender);
        };
    }, [editor, toolbarProviderValue]);

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
            data-layout={LAYOUT.STICKY_TOOLBAR}
        >
            <ToolbarProvider value={toolbarProviderValue}>
                <MemoizedFlexibleToolbar
                    status={
                        resourceReplacementPending ? resourceReplacementToolbarStatus : undefined
                    }
                    data={toolbarConfig}
                    hiddenActions={hiddenActionsConfig}
                    editor={toolbarEditor}
                    focus={handleFocus}
                    dotsTitle={i18n('more_action')}
                    onClick={clickHandle}
                    display={toolbarDisplay}
                    disableTooltip={mobile}
                    disableHotkey={mobile}
                    disablePreview={mobile}
                />
            </ToolbarProvider>
            {children}
        </div>
    );
}

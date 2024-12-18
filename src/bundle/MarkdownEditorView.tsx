import React, {MutableRefObject, useEffect, useMemo, useRef, useState} from 'react';

import type {ToasterPublicMethods} from '@gravity-ui/uikit';
import {ErrorBoundary} from 'react-error-boundary';
import {useEnsuredForwardedRef, useKey, useUpdate} from 'react-use';

import {ClassNameProps, cn} from '../classname';
import {i18n} from '../i18n/bundle';
import {logger} from '../logger';
import {ToolbarName} from '../modules/toolbars/constants';
import {commonmark, defaultPreset, full, yfm, zero} from '../modules/toolbars/presets';
import {EditorPreset, ToolbarItem, ToolbarsPresetOrEditorPreset} from '../modules/toolbars/types';
import {ToasterContext, useBooleanState, useSticky} from '../react-utils';
import {ToolbarDataType} from '../toolbar';
import {isMac} from '../utils';

import type {Editor, EditorInt} from './Editor';
import {HorizontalDrag} from './HorizontalDrag';
import {MarkupEditorView} from './MarkupEditorView';
import {SplitModeView} from './SplitModeView';
import {WysiwygEditorView} from './WysiwygEditorView';
import {MToolbarData, MToolbarItemData, WToolbarData, WToolbarItemData} from './config';
import {useMarkdownEditorContext} from './context';
import {EditorSettings, EditorSettingsProps} from './settings';
import {stickyCn} from './sticky';
import type {MarkdownEditorMode} from './types';

import '../styles/styles.scss';
import './MarkdownEditorView.scss'; // eslint-disable-line import/order

export const cnEditorComponent = cn('editor-component');
const b = cnEditorComponent;

export type MarkdownEditorViewProps = ClassNameProps & {
    editor?: Editor;
    autofocus?: boolean;
    toolbarsPreset?: ToolbarsPresetOrEditorPreset;
    /**
     * @deprecated use `toolbarsPreset` instead
     */
    markupToolbarConfig?: MToolbarData;
    /**
     * @deprecated use `toolbarsPreset` instead
     */
    wysiwygToolbarConfig?: WToolbarData;
    /**
     * @deprecated use `toolbarsPreset` instead
     */
    markupHiddenActionsConfig?: MToolbarItemData[];
    /**
     * @deprecated use `toolbarsPreset` instead
     */
    wysiwygHiddenActionsConfig?: WToolbarItemData[];
    /** @default true */
    settingsVisible?: boolean;
    toaster: ToasterPublicMethods;
    stickyToolbar: boolean;
    enableSubmitInPreview?: boolean;
    hidePreviewAfterSubmit?: boolean;
};

const defaultPresets = {
    zero,
    commonmark,
    default: defaultPreset,
    yfm,
    full,
};

const transformItem = (
    type: 'wysiwyg' | 'markup',
    item?: ToolbarItem<ToolbarDataType.SingleButton | ToolbarDataType.ListButton>,
    id = 'unknown',
) => {
    if (!item) return null;
    const isListButton = item.view.type === ToolbarDataType.ListButton;

    return {
        type: item.view.type || 's-button',
        id,
        title: item.view.title,
        hint: item.view.hint,
        icon: item.view.icon,
        hotkey: item.view.hotkey,
        ...(isListButton && {withArrow: (item.view as any).withArrow}),
        ...(type === 'wysiwyg' && item.wysiwyg && {...item.wysiwyg}),
        ...(type === 'markup' && item.markup && {...item.markup}),
    };
};

export const createConfig = <
    T extends WToolbarData | MToolbarData | WToolbarItemData[][] | MToolbarItemData[][],
>(
    editorType: 'wysiwyg' | 'markup',
    toolbarPreset: ToolbarsPresetOrEditorPreset,
    toolbarName: string,
): T => {
    const preset =
        typeof toolbarPreset === 'string' ? getDefaultPresetByName(toolbarPreset) : toolbarPreset;
    const orders = preset.orders[toolbarName] ?? [[]];
    const {items} = preset;

    const toolbarData = orders.map((group) =>
        group.map((item) => {
            return typeof item === 'string'
                ? transformItem(editorType, items[item], item)
                : {
                      ...transformItem(editorType, items[item.id], item.id),
                      data: item.items.map((id) => transformItem(editorType, items[id], id)),
                  };
        }),
    );

    return toolbarData as T;
};

const getDefaultPresetByName = (initialPreset: EditorPreset) => {
    const presetName = ['zero', 'commonmark', 'default', 'yfm', 'full'].includes(initialPreset)
        ? initialPreset
        : 'default';
    return defaultPresets[presetName];
};

export const MarkdownEditorView = React.forwardRef<HTMLDivElement, MarkdownEditorViewProps>(
    (props, ref) => {
        const divRef = useEnsuredForwardedRef(ref as MutableRefObject<HTMLDivElement>);

        const [isMounted, setIsMounted] = useState(false);
        useEffect(() => {
            setIsMounted(true);
        }, []);

        const [showPreview, , unsetShowPreview, toggleShowPreview] = useBooleanState(false);

        const context = useMarkdownEditorContext();
        const editor = (props.editor ?? context) as EditorInt;
        if (!editor)
            throw new Error(
                '[MarkdownEditorView]: an instance of the editor must be passed through the props or context',
            );

        const {
            autofocus,
            className,
            settingsVisible = true,
            toolbarsPreset,
            toaster,
            stickyToolbar,
            enableSubmitInPreview = true,
            hidePreviewAfterSubmit = false,
        } = props;

        const wysiwygToolbarConfig = toolbarsPreset
            ? createConfig<WToolbarData>('wysiwyg', toolbarsPreset, ToolbarName.wysiwygMain)
            : props.wysiwygToolbarConfig ??
              createConfig<WToolbarData>('wysiwyg', editor.preset, ToolbarName.wysiwygMain);

        const markupToolbarConfig = toolbarsPreset
            ? createConfig<MToolbarData>('markup', toolbarsPreset, ToolbarName.markupMain)
            : props.markupToolbarConfig ??
              createConfig<MToolbarData>('markup', editor.preset, ToolbarName.markupMain);

        // TODO: @makhnatkin add getToolbarItemDataFromToolbarData
        const wysiwygHiddenActionsConfig = toolbarsPreset
            ? createConfig<WToolbarItemData[][]>(
                  'wysiwyg',
                  toolbarsPreset,
                  ToolbarName.wysiwygHidden,
              )[0]
            : props.wysiwygHiddenActionsConfig ??
              createConfig<WToolbarItemData[][]>(
                  'wysiwyg',
                  editor.preset,
                  ToolbarName.wysiwygHidden,
              )[0];

        const markupHiddenActionsConfig = toolbarsPreset
            ? createConfig<MToolbarItemData[][]>(
                  'markup',
                  toolbarsPreset,
                  ToolbarName.markupHidden,
              )[0]
            : props.markupHiddenActionsConfig ??
              createConfig<MToolbarItemData[][]>(
                  'markup',
                  editor.preset,
                  ToolbarName.markupHidden,
              )[0];

        const rerender = useUpdate();
        React.useLayoutEffect(() => {
            editor.on('rerender', rerender);
            return () => {
                editor.off('rerender', rerender);
            };
        }, [editor, rerender]);

        const onModeChange = React.useCallback(
            (type: MarkdownEditorMode) => {
                editor.changeEditorMode({mode: type, reason: 'settings'});
                unsetShowPreview();
            },
            [editor, unsetShowPreview],
        );
        const onToolbarVisibilityChange = React.useCallback(
            (visible: boolean) => {
                editor.changeToolbarVisibility({visible});
            },
            [editor],
        );
        const onSplitModeChange = React.useCallback(
            (splitModeEnabled: boolean) => {
                unsetShowPreview();
                editor.changeSplitModeEnabled({splitModeEnabled});
            },
            [editor, unsetShowPreview],
        );

        const onShowPreviewChange = React.useCallback(
            (showPreviewValue: boolean) => {
                editor.changeSplitModeEnabled({splitModeEnabled: false});
                if (showPreviewValue !== showPreview) toggleShowPreview();
            },
            [editor, showPreview, toggleShowPreview],
        );

        const editorMode = editor.currentMode;
        const markupSplitMode =
            editor.splitModeEnabled && editor.splitMode && editorMode === 'markup';
        const canRenderPreview = Boolean(
            editor.renderPreview && editorMode === 'markup' && !editor.splitModeEnabled,
        );

        useKey(
            (e) => canRenderPreview && isPreviewKeyDown(e),
            (e) => {
                e.preventDefault();
                onShowPreviewChange(!showPreview);
            },
            {event: 'keydown'},
            [showPreview, editorMode, onShowPreviewChange, canRenderPreview],
        );

        const editorWrapperRef = useRef(null);
        const splitModeViewWrapperRef = useRef(null);

        useEffect(() => {
            if (showPreview) {
                divRef.current.focus();
            }
        }, [divRef, showPreview]);

        useKey(
            (e) =>
                enableSubmitInPreview &&
                showPreview &&
                isWrapperFocused(divRef) &&
                isSubmitKeyDown(e),
            () => {
                editor.emit('submit', null);

                if (hidePreviewAfterSubmit) {
                    onShowPreviewChange(false);
                }
            },
            {event: 'keydown'},
            [hidePreviewAfterSubmit, enableSubmitInPreview, showPreview, showPreview],
        );

        const settings = useMemo(
            () => (
                <Settings
                    mode={editorMode}
                    settingsVisible={settingsVisible}
                    onModeChange={onModeChange}
                    toolbarVisibility={editor.toolbarVisible && !showPreview}
                    onToolbarVisibilityChange={onToolbarVisibilityChange}
                    onSplitModeChange={onSplitModeChange}
                    splitModeEnabled={editor.splitModeEnabled}
                    splitMode={editor.splitMode}
                    stickyToolbar={stickyToolbar}
                    onShowPreviewChange={onShowPreviewChange}
                    showPreview={showPreview}
                    renderPreviewButton={canRenderPreview}
                />
            ),
            [
                editorMode,
                settingsVisible,
                editor.toolbarVisible,
                editor.splitModeEnabled,
                editor.splitMode,
                onModeChange,
                showPreview,
                onToolbarVisibilityChange,
                onSplitModeChange,
                stickyToolbar,
                onShowPreviewChange,
                canRenderPreview,
            ],
        );

        return (
            <ErrorBoundary
                onError={(e) => {
                    logger.error(e);
                }}
                fallbackRender={({error, resetErrorBoundary}) => {
                    toaster.add({
                        theme: 'danger',
                        name: 'g-md-editor-error',
                        title: i18n('error-title'),
                        content: error.message,
                    });
                    setTimeout(() => {
                        resetErrorBoundary();
                        editor.changeEditorMode({
                            mode: 'markup',
                            reason: 'error-boundary',
                            emit: false,
                        });
                    });
                    return null;
                }}
            >
                <ToasterContext.Provider value={toaster}>
                    <div
                        ref={divRef}
                        className={b(
                            {
                                settings: settingsVisible,
                                split: markupSplitMode && editor.splitMode,
                            },
                            [className],
                        )}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={b('editor-wrapper')} ref={editorWrapperRef}>
                            {showPreview ? (
                                <>
                                    <div className={b('preview-wrapper')}>
                                        {editor.renderPreview?.({
                                            getValue: editor.getValue,
                                            mode: 'preview',
                                            md: editor.mdOptions,
                                            directiveSyntax: editor.directiveSyntax,
                                        })}
                                    </div>
                                    {settings}
                                </>
                            ) : (
                                <>
                                    {editorMode === 'wysiwyg' && (
                                        <WysiwygEditorView
                                            editor={editor}
                                            autofocus={autofocus}
                                            settingsVisible={settingsVisible}
                                            toolbarConfig={wysiwygToolbarConfig}
                                            toolbarVisible={editor.toolbarVisible}
                                            hiddenActionsConfig={wysiwygHiddenActionsConfig}
                                            className={b('editor', {mode: editorMode})}
                                            toolbarClassName={b('toolbar')}
                                            stickyToolbar={stickyToolbar}
                                        >
                                            {editor.toolbarVisible && settingsVisible && settings}
                                        </WysiwygEditorView>
                                    )}
                                    {editorMode === 'markup' && (
                                        <MarkupEditorView
                                            editor={editor}
                                            autofocus={autofocus}
                                            settingsVisible={settingsVisible}
                                            toolbarConfig={markupToolbarConfig}
                                            toolbarVisible={editor.toolbarVisible}
                                            splitMode={editor.splitMode}
                                            splitModeEnabled={editor.splitModeEnabled}
                                            hiddenActionsConfig={markupHiddenActionsConfig}
                                            className={b('editor', {mode: editorMode})}
                                            toolbarClassName={b('toolbar')}
                                            stickyToolbar={stickyToolbar}
                                        >
                                            {editor.toolbarVisible && settings}
                                        </MarkupEditorView>
                                    )}
                                    {!editor.toolbarVisible && settings}
                                </>
                            )}
                        </div>

                        {markupSplitMode && (
                            <>
                                {editor.splitMode === 'horizontal' ? (
                                    <HorizontalDrag
                                        editor={editor}
                                        isMounted={isMounted}
                                        leftElRef={editorWrapperRef}
                                        rightElRef={splitModeViewWrapperRef}
                                        wrapperRef={divRef}
                                    />
                                ) : (
                                    <div className={b('resizer')} />
                                )}
                                <SplitModeView editor={editor} ref={splitModeViewWrapperRef} />
                            </>
                        )}
                    </div>
                </ToasterContext.Provider>
            </ErrorBoundary>
        );
    },
);
MarkdownEditorView.displayName = 'MarkdownEditorView';

interface MarkupSearchAnchorProps extends Pick<EditorSettingsProps, 'mode'> {}

const MarkupSearchAnchor: React.FC<MarkupSearchAnchorProps> = ({mode}) => (
    <>{mode === 'markup' && <div className="g-md-search-anchor"></div>}</>
);

function Settings(props: EditorSettingsProps & {stickyToolbar: boolean}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isSticky = useSticky(wrapperRef) && props.toolbarVisibility && props.stickyToolbar;

    return (
        <>
            {(props.renderPreviewButton || props.settingsVisible) && (
                <div className={b('settings-wrapper')}>
                    <div
                        ref={wrapperRef}
                        className={stickyCn.settings({
                            withToolbar: props.toolbarVisibility,
                            stickyActive: isSticky,
                        })}
                    >
                        <EditorSettings {...props} />
                        <MarkupSearchAnchor {...props} />
                    </div>
                </div>
            )}
        </>
    );
}

function isPreviewKeyDown(e: KeyboardEvent) {
    const modKey = isMac() ? e.metaKey : e.ctrlKey;
    return modKey && e.shiftKey && e.code === 'KeyP';
}

function isWrapperFocused(divRef: React.RefObject<HTMLDivElement>) {
    return document.activeElement === divRef.current;
}

function isSubmitKeyDown(e: KeyboardEvent) {
    const modKey = isMac() ? e.metaKey : e.ctrlKey;
    return modKey && e.code === 'Enter';
}

import {
    forwardRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {type QAProps, useToaster} from '@gravity-ui/uikit';
import {ErrorBoundary} from 'react-error-boundary';
import {useEnsuredForwardedRef, useKey, useUpdate} from 'react-use';

import {type ClassNameProps, cn} from '../classname';
import {i18n} from '../i18n/bundle';
import {globalLogger} from '../logger';
import type {ToolbarsPreset} from '../modules/toolbars/types';
import {useBooleanState, useSticky} from '../react-utils';
import {isMac} from '../utils';

import type {Editor, EditorInt} from './Editor';
import {HorizontalDrag} from './HorizontalDrag';
import {MarkupEditorView} from './MarkupEditorView';
import {SplitModeView} from './SplitModeView';
import {WysiwygEditorView} from './WysiwygEditorView';
import {useMarkdownEditorContext} from './context';
import {EditorSettings, type EditorSettingsProps, type SettingItems} from './settings';
import {stickyCn} from './sticky';
import type {MToolbarData, MToolbarItemData, WToolbarData, WToolbarItemData} from './toolbar/types';
import {getToolbarsConfigs} from './toolbar/utils/toolbarsConfigs';
import type {MarkdownEditorMode} from './types';

import '../styles/styles.scss';
import './MarkdownEditorView.scss'; // eslint-disable-line import/order

export const cnEditorComponent = cn('editor-component');
const b = cnEditorComponent;

interface EditorWrapperProps extends QAProps, ToolbarConfigs, Omit<ViewProps, 'editor'> {
    editor: EditorInt;
    editorMode: MarkdownEditorMode;
    isFocused: boolean;
    showPreview: boolean;
    toggleShowPreview: () => void;
    unsetShowPreview: () => void;
    mobile?: boolean;
}
const EditorWrapper = forwardRef<HTMLDivElement, EditorWrapperProps>(
    (
        {
            autofocus,
            editor,
            editorMode,
            enableSubmitInPreview,
            hidePreviewAfterSubmit,
            isFocused,
            markupHiddenActionsConfig: initialMarkupHiddenActionsConfig,
            markupToolbarConfig: initialMarkupToolbarConfig,
            qa,
            settingsVisible: settingsVisibleProp,
            showPreview,
            stickyToolbar,
            toggleShowPreview,
            toolbarsPreset,
            unsetShowPreview,
            wysiwygHiddenActionsConfig: initialWysiwygHiddenActionsConfig,
            wysiwygToolbarConfig: initialWysiwygToolbarConfig,
            mobile = false,
        },
        ref,
    ) => {
        const {
            wysiwygToolbarConfig,
            markupToolbarConfig,
            wysiwygHiddenActionsConfig,
            markupHiddenActionsConfig,
        } = useMemo(
            () =>
                getToolbarsConfigs({
                    toolbarsPreset,
                    props: {
                        wysiwygToolbarConfig: initialWysiwygToolbarConfig,
                        markupToolbarConfig: initialMarkupToolbarConfig,
                        wysiwygHiddenActionsConfig: initialWysiwygHiddenActionsConfig,
                        markupHiddenActionsConfig: initialMarkupHiddenActionsConfig,
                    },
                    preset: editor.preset,
                }),
            [
                toolbarsPreset,
                initialWysiwygToolbarConfig,
                initialMarkupToolbarConfig,
                initialWysiwygHiddenActionsConfig,
                initialMarkupHiddenActionsConfig,
                editor.preset,
            ],
        );
        const onModeChange = useCallback(
            (type: MarkdownEditorMode) => {
                editor.changeEditorMode({mode: type, reason: 'settings'});
                unsetShowPreview();
            },
            [editor, unsetShowPreview],
        );
        const onToolbarVisibilityChange = useCallback(
            (visible: boolean) => {
                editor.changeToolbarVisibility({visible});
            },
            [editor],
        );
        const onSplitModeChange = useCallback(
            (splitModeEnabled: boolean) => {
                unsetShowPreview();
                editor.changeSplitModeEnabled({splitModeEnabled});
            },
            [editor, unsetShowPreview],
        );
        const onShowPreviewChange = useCallback(
            (showPreviewValue: boolean) => {
                editor.changeSplitModeEnabled({splitModeEnabled: false});
                if (showPreviewValue !== showPreview) toggleShowPreview();
            },
            [editor, showPreview, toggleShowPreview],
        );
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

        useKey(
            (e) => Boolean(enableSubmitInPreview && showPreview && isFocused && isSubmitKeyDown(e)),
            () => {
                editor.emit('submit', null);

                if (hidePreviewAfterSubmit) {
                    onShowPreviewChange(false);
                }
            },
            {event: 'keydown'},
            [hidePreviewAfterSubmit, enableSubmitInPreview, showPreview, showPreview],
        );

        const settingsProps = {
            mode: editorMode,
            onModeChange,
            onShowPreviewChange,
            onSplitModeChange,
            onToolbarVisibilityChange,
            renderPreviewButton: canRenderPreview,
            showPreview,
            splitMode: editor.splitMode,
            splitModeEnabled: editor.splitModeEnabled,
            stickyToolbar,
            toolbarVisibility: editor.toolbarVisible && !showPreview,
        };

        const areSettingsVisible =
            settingsVisibleProp === true ||
            (Array.isArray(settingsVisibleProp) && settingsVisibleProp.length > 0);

        return (
            <div
                className={b('editor-wrapper')}
                ref={ref}
                data-qa={qa}
                data-mode={editor.currentMode}
            >
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
                        <Settings {...settingsProps} settingsVisible={settingsVisibleProp} />
                    </>
                ) : (
                    <>
                        {editorMode === 'wysiwyg' && (
                            <WysiwygEditorView
                                editor={editor}
                                autofocus={autofocus}
                                settingsVisible={areSettingsVisible}
                                toolbarConfig={wysiwygToolbarConfig}
                                toolbarVisible={editor.toolbarVisible}
                                hiddenActionsConfig={wysiwygHiddenActionsConfig}
                                className={b('editor', {mode: editorMode})}
                                toolbarClassName={b('toolbar')}
                                stickyToolbar={stickyToolbar}
                                mobile={mobile}
                            >
                                <Settings
                                    {...settingsProps}
                                    settingsVisible={editor.toolbarVisible && settingsVisibleProp}
                                />
                            </WysiwygEditorView>
                        )}
                        {editorMode === 'markup' && (
                            <MarkupEditorView
                                editor={editor}
                                autofocus={autofocus}
                                settingsVisible={areSettingsVisible}
                                toolbarConfig={markupToolbarConfig}
                                toolbarVisible={editor.toolbarVisible}
                                splitMode={editor.splitMode}
                                splitModeEnabled={editor.splitModeEnabled}
                                hiddenActionsConfig={markupHiddenActionsConfig}
                                className={b('editor', {mode: editorMode})}
                                toolbarClassName={b('toolbar')}
                                stickyToolbar={stickyToolbar}
                                mobile={mobile}
                            >
                                <Settings
                                    {...settingsProps}
                                    settingsVisible={editor.toolbarVisible && settingsVisibleProp}
                                />
                            </MarkupEditorView>
                        )}
                        <Settings
                            {...settingsProps}
                            settingsVisible={!editor.toolbarVisible && settingsVisibleProp}
                            renderPreviewButton={!editor.toolbarVisible && canRenderPreview}
                        />
                    </>
                )}
            </div>
        );
    },
);

EditorWrapper.displayName = 'EditorWrapper';

type ToolbarConfigs = {
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
};

type ViewProps = {
    editor?: Editor;
    autofocus?: boolean;
    // MAJOR: rename to settings
    /** @default true */
    settingsVisible?: boolean | SettingItems[];
    toolbarsPreset?: ToolbarsPreset;
    stickyToolbar: boolean;
    enableSubmitInPreview?: boolean;
    hidePreviewAfterSubmit?: boolean;
};

export type MarkdownEditorViewProps = ClassNameProps & ToolbarConfigs & ViewProps & QAProps & {};

export const MarkdownEditorView = forwardRef<HTMLDivElement, MarkdownEditorViewProps>(
    (props, ref) => {
        const divRef = useEnsuredForwardedRef(ref as React.MutableRefObject<HTMLDivElement>);
        const editorWrapperRef = useRef(null);
        const [showPreview, , unsetShowPreview, toggleShowPreview] = useBooleanState(false);

        const [isMounted, setIsMounted] = useState(false);
        useEffect(() => {
            setIsMounted(true);
        }, []);

        const context = useMarkdownEditorContext();
        const editor = (props.editor ?? context) as EditorInt;
        if (!editor)
            throw new Error(
                '[MarkdownEditorView]: an instance of the editor must be passed through the props or context',
            );

        const {
            autofocus,
            className,
            enableSubmitInPreview = true,
            hidePreviewAfterSubmit = false,
            markupHiddenActionsConfig,
            markupToolbarConfig,
            qa,
            settingsVisible = true,
            stickyToolbar,
            toolbarsPreset,
            wysiwygHiddenActionsConfig,
            wysiwygToolbarConfig,
        } = props;

        const rerender = useUpdate();
        useLayoutEffect(() => {
            editor.on('rerender', rerender);
            return () => {
                editor.off('rerender', rerender);
            };
        }, [editor, rerender]);

        const editorMode = editor.currentMode;
        const markupSplitMode =
            editor.splitModeEnabled && editor.splitMode && editorMode === 'markup';

        const splitModeViewWrapperRef = useRef(null);

        const toaster = useToaster();

        useEffect(() => {
            if (showPreview) {
                divRef.current.focus();
            }
        }, [divRef, showPreview]);

        const areSettingsVisible =
            settingsVisible === true ||
            (Array.isArray(settingsVisible) && settingsVisible.length > 0);

        return (
            <ErrorBoundary
                onError={(e) => {
                    globalLogger.error(e);
                    editor.logger.error(e);
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
                <div
                    ref={divRef}
                    data-qa={qa}
                    className={b(
                        {
                            settings: areSettingsVisible,
                            split: markupSplitMode && editor.splitMode,
                        },
                        [className],
                    )}
                    role="button"
                    tabIndex={0}
                >
                    <EditorWrapper
                        autofocus={autofocus}
                        editor={editor}
                        editorMode={editorMode}
                        enableSubmitInPreview={enableSubmitInPreview}
                        hidePreviewAfterSubmit={hidePreviewAfterSubmit}
                        isFocused={isWrapperFocused(divRef)}
                        markupHiddenActionsConfig={markupHiddenActionsConfig}
                        markupToolbarConfig={markupToolbarConfig}
                        qa="g-md-editor-mode"
                        ref={editorWrapperRef}
                        settingsVisible={settingsVisible}
                        showPreview={showPreview}
                        stickyToolbar={stickyToolbar}
                        toggleShowPreview={toggleShowPreview}
                        toolbarsPreset={toolbarsPreset}
                        unsetShowPreview={unsetShowPreview}
                        wysiwygHiddenActionsConfig={wysiwygHiddenActionsConfig}
                        wysiwygToolbarConfig={wysiwygToolbarConfig}
                    />

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

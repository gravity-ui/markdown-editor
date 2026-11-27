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

import type {ClassNameProps} from '../classname';
import {i18n} from '../i18n/bundle';
import {globalLogger} from '../logger';
import type {ToolbarsPreset} from '../modules/toolbars/types';
import {isMac} from '../utils';

import type {EditorInt} from './Editor';
import {HorizontalDrag} from './HorizontalDrag';
import {MarkupEditorView} from './MarkupEditorView';
import {SplitModeView} from './SplitModeView';
import {WysiwygEditorView} from './WysiwygEditorView';
import {useMarkdownEditorContext} from './context';
import {cnEditorComponent} from './editor-classname';
import type {MarkdownEditorInstance} from './editor-public-types';
import type {SettingItems} from './settings';
import {SettingsLayout} from './settings/SettingsLayout';
import {resolveContenteditableAttributes} from './shared/contenteditable-attributes';
import type {ToolbarConfigs} from './toolbar/types';
import {getToolbarsConfigs} from './toolbar/utils/toolbarsConfigs';
import type {ContenteditableAttributes, MarkdownEditorMode} from './types';
import {useContextualToolbars} from './wysiwyg/useContextualToolbars';

import '../styles/styles.scss';
import './MarkdownEditorView.scss'; // eslint-disable-line import/order

const b = cnEditorComponent;

interface EditorWrapperProps extends QAProps, ToolbarConfigs, Omit<ViewProps, 'editor'> {
    editor: EditorInt;
    editorMode: MarkdownEditorMode;
}
const EditorWrapper = forwardRef<HTMLDivElement, EditorWrapperProps>(
    (
        {
            autofocus,
            editor,
            editorMode,
            contenteditableAttributes,
            markupHiddenActionsConfig: initialMarkupHiddenActionsConfig,
            markupToolbarConfig: initialMarkupToolbarConfig,
            qa,
            settingsVisible: settingsVisibleProp,
            stickyToolbar,
            toolbarsPreset,
            wysiwygHiddenActionsConfig: initialWysiwygHiddenActionsConfig,
            wysiwygToolbarConfig: initialWysiwygToolbarConfig,
        },
        ref,
    ) => {
        const showPreview = editor.previewVisible;

        useContextualToolbars(editor, editorMode === 'wysiwyg', toolbarsPreset);

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
                editor.changePreviewVisible(false);
            },
            [editor],
        );
        const onToolbarVisibilityChange = useCallback(
            (visible: boolean) => {
                editor.changeToolbarVisibility({visible});
            },
            [editor],
        );
        const onSplitModeChange = useCallback(
            (splitModeEnabled: boolean) => {
                editor.changeSplitModeEnabled({splitModeEnabled});
            },
            [editor],
        );
        const onShowPreviewChange = useCallback(
            (showPreviewValue: boolean) => {
                editor.changePreviewVisible(showPreviewValue);
            },
            [editor],
        );
        const canRenderPreview = Boolean(
            editor.renderPreview && editorMode === 'markup' && !editor.splitModeEnabled,
        );

        useKey(
            (e) => canRenderPreview && isPreviewKeyDown(e),
            (e) => {
                e.preventDefault();
                editor.changePreviewVisible();
            },
            {event: 'keydown'},
            [editorMode, editor, canRenderPreview],
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
            disableMark: editor.mobile,
        };

        const areSettingsVisible =
            settingsVisibleProp === true ||
            (Array.isArray(settingsVisibleProp) && settingsVisibleProp.length > 0);

        const toolbarDisplay = editor.mobile ? 'scroll' : 'shrink';

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
                        <SettingsLayout {...settingsProps} settingsVisible={settingsVisibleProp} />
                    </>
                ) : (
                    <>
                        {editorMode === 'wysiwyg' && (
                            <WysiwygEditorView
                                editor={editor}
                                contenteditableAttributes={resolveContenteditableAttributes(
                                    contenteditableAttributes,
                                    'wysiwyg',
                                )}
                                autofocus={autofocus}
                                settingsVisible={areSettingsVisible}
                                toolbarConfig={wysiwygToolbarConfig}
                                toolbarVisible={editor.toolbarVisible}
                                hiddenActionsConfig={wysiwygHiddenActionsConfig}
                                className={b('editor', {mode: editorMode})}
                                toolbarClassName={b('toolbar')}
                                stickyToolbar={stickyToolbar}
                                toolbarDisplay={toolbarDisplay}
                            >
                                <SettingsLayout
                                    {...settingsProps}
                                    settingsVisible={editor.toolbarVisible && settingsVisibleProp}
                                />
                            </WysiwygEditorView>
                        )}
                        {editorMode === 'markup' && (
                            <MarkupEditorView
                                editor={editor}
                                contenteditableAttributes={resolveContenteditableAttributes(
                                    contenteditableAttributes,
                                    'markup',
                                )}
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
                                toolbarDisplay={toolbarDisplay}
                            >
                                <SettingsLayout
                                    {...settingsProps}
                                    settingsVisible={editor.toolbarVisible && settingsVisibleProp}
                                />
                            </MarkupEditorView>
                        )}
                        <SettingsLayout
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

type ViewProps = {
    editor?: MarkdownEditorInstance;
    autofocus?: boolean;
    contenteditableAttributes?: ContenteditableAttributes;
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
            contenteditableAttributes,
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
            if (editor.previewVisible) {
                divRef.current.focus();
            }
        }, [divRef, editor, editor.previewVisible]);

        const showPreview = editor.previewVisible;

        useKey(
            (e) =>
                Boolean(
                    enableSubmitInPreview &&
                    showPreview &&
                    isWrapperFocused(divRef) &&
                    isSubmitKeyDown(e),
                ),
            () => {
                editor.emit('submit', null);

                if (hidePreviewAfterSubmit) {
                    editor.changePreviewVisible(false);
                }
            },
            {event: 'keydown'},
            [hidePreviewAfterSubmit, enableSubmitInPreview, showPreview, editor, divRef],
        );

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
                    tabIndex={-1}
                >
                    <EditorWrapper
                        autofocus={autofocus}
                        editor={editor}
                        editorMode={editorMode}
                        contenteditableAttributes={contenteditableAttributes}
                        markupHiddenActionsConfig={markupHiddenActionsConfig}
                        markupToolbarConfig={markupToolbarConfig}
                        qa="g-md-editor-mode"
                        ref={editorWrapperRef}
                        settingsVisible={settingsVisible}
                        stickyToolbar={stickyToolbar}
                        toolbarsPreset={toolbarsPreset}
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

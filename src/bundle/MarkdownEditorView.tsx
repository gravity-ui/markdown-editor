import React, {MutableRefObject, useEffect, useMemo, useRef, useState} from 'react';

import type {ToasterPublicMethods} from '@gravity-ui/uikit';
import {ErrorBoundary} from 'react-error-boundary';
import {useEnsuredForwardedRef, useKey, useUpdate} from 'react-use';

import {ClassNameProps, cn} from '../classname';
import {i18n} from '../i18n/bundle';
import {logger} from '../logger';
import {ToasterContext, useBooleanState, useSticky} from '../react-utils';
import {isMac} from '../utils';

import type {Editor, EditorInt, EditorMode} from './Editor';
import {HorizontalDrag} from './HorizontalDrag';
import {MarkupEditorView} from './MarkupEditorView';
import {SplitModeView} from './SplitModeView';
import {WysiwygEditorView} from './WysiwygEditorView';
import {
    MToolbarData,
    MToolbarItemData,
    WToolbarData,
    WToolbarItemData,
    mHiddenDataByPreset,
    mToolbarConfigByPreset,
    wHiddenDataByPreset,
    wToolbarConfigByPreset,
} from './config';
import {useMarkdownEditorContext} from './context';
import {EditorSettings, EditorSettingsProps} from './settings';
import {stickyCn} from './sticky';

import '../styles/styles.scss';
import './MarkdownEditorView.scss'; // eslint-disable-line import/order

export const cnEditorComponent = cn('editor-component');
const b = cnEditorComponent;

export type MarkdownEditorViewProps = ClassNameProps & {
    editor?: Editor;
    autofocus?: boolean;
    markupToolbarConfig?: MToolbarData;
    wysiwygToolbarConfig?: WToolbarData;
    markupHiddenActionsConfig?: MToolbarItemData[];
    wysiwygHiddenActionsConfig?: WToolbarItemData[];
    /** @default true */
    settingsVisible?: boolean;
    toaster: ToasterPublicMethods;
    stickyToolbar: boolean;
    enableSubmitInPreview?: boolean;
    clearPreviewOnSubmit?: boolean;
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
            markupToolbarConfig = mToolbarConfigByPreset[editor.preset],
            wysiwygToolbarConfig = wToolbarConfigByPreset[editor.preset],
            markupHiddenActionsConfig = mHiddenDataByPreset[editor.preset],
            wysiwygHiddenActionsConfig = wHiddenDataByPreset[editor.preset],
            toaster,
            stickyToolbar,
            enableSubmitInPreview = false,
            clearPreviewOnSubmit = false,
        } = props;

        const rerender = useUpdate();
        React.useLayoutEffect(() => {
            editor.on('rerender', rerender);
            return () => {
                editor.off('rerender', rerender);
            };
        }, [editor, rerender]);

        const onModeChange = React.useCallback(
            (type: EditorMode) => {
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
            () => onShowPreviewChange(!showPreview),
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

                if (clearPreviewOnSubmit) {
                    onShowPreviewChange(false);
                }
            },
            {event: 'keydown'},
            [showPreview, clearPreviewOnSubmit],
        );

        const settings = useMemo(
            () => (
                <Settings
                    mode={editorMode}
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
                canRenderPreview,
                stickyToolbar,
                editor.splitMode,
                editor.splitModeEnabled,
                editor.toolbarVisible,
                editorMode,
                onModeChange,
                onShowPreviewChange,
                onSplitModeChange,
                onToolbarVisibilityChange,
                showPreview,
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
                                            {editor.toolbarVisible && settingsVisible && settings}
                                        </MarkupEditorView>
                                    )}
                                    {!editor.toolbarVisible && settingsVisible && settings}
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

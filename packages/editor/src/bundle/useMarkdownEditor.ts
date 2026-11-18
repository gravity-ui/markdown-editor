import {useLayoutEffect, useMemo} from 'react';

import {createWysiwygTabFocusModeExtension} from 'src/extensions/behavior/TabFocusMode';
import {Logger2, globalLogger} from 'src/logger';
import {createMarkupTabFocusMode} from 'src/markup/codemirror/tab-focus-mode';
import {ReactRenderStorage} from 'src/modules/react-renderer';
import {DirectiveSyntaxContext} from 'src/utils/directive';
import {SafeEventEmitter} from 'src/utils/event-emitter';
import {TabFocusModeState} from 'src/utils/tab-focus-mode';

import {EditorImpl, type EditorOptions} from './Editor';
import type {MarkdownEditorInstance} from './editor-public-types';
import {useMarkupCore} from './markup/useMarkupCore';
import type {EditorEventMap} from './shared/events';
import type {EditorMarkupState} from './shared/types';
import type {MarkdownEditorMode, MarkdownEditorOptions} from './types';
import {useWysiwygCore} from './wysiwyg/useWysiwygCore';

export type UseMarkdownEditorProps = MarkdownEditorOptions;

export function useMarkdownEditor(
    props: UseMarkdownEditorProps,
    deps: React.DependencyList = [],
): MarkdownEditorInstance {
    const {
        options: editorOptions,
        events,
        markupState: editorMarkupState,
        getInitialMarkup,
        tabFocusMode,
        initializeMarkup,
    } = useMemo(() => {
        const logger = props.logger ?? new Logger2();
        const runtimeEvents = new SafeEventEmitter<EditorEventMap>({
            onError: (error) => {
                logger.error(error);
                globalLogger.error(error);
            },
        });
        const {markupConfig = {}, wysiwygConfig = {}} = props;
        const extraWysiwygExtensions = wysiwygConfig.extensions;
        const extensionOptions = wysiwygConfig.extensionOptions;
        const tabFocus = new TabFocusModeState(props.initial?.tabFocusMode);
        const markupTabFocus = createMarkupTabFocusMode(tabFocus);
        tabFocus.on('change', ({mode}) => {
            runtimeEvents.emit('rerender', null);
            runtimeEvents.emit('change-tab-focus-mode', {mode});
        });
        const options: EditorOptions = {
            ...props,
            markupConfig: {
                ...markupConfig,
                extensions: [markupTabFocus.extension, ...(markupConfig.extensions ?? [])],
            },
            wysiwygConfig: {
                ...wysiwygConfig,
                extensions: (builder) => {
                    builder.use(createWysiwygTabFocusModeExtension(tabFocus));
                    if (extraWysiwygExtensions) {
                        builder.use(extraWysiwygExtensions, extensionOptions);
                    }
                },
            },
            logger,
            preset: props.preset ?? 'full',
            renderStorage: new ReactRenderStorage(),
            directiveSyntax: new DirectiveSyntaxContext(props.experimental?.directiveSyntax),
        };
        const markupState: EditorMarkupState = {markup: props.initial?.markup ?? ''};
        return {
            options,
            markupState,
            tabFocusMode: tabFocus,
            initializeMarkup: markupTabFocus.initialize,
            getInitialMarkup: () => markupState.markup,
            events: runtimeEvents,
        };
    }, deps);
    const wysiwyg = useWysiwygCore(editorOptions, events, getInitialMarkup);
    const markup = useMarkupCore(editorOptions, events, getInitialMarkup, initializeMarkup);
    const editor = useMemo(
        () =>
            new EditorImpl(editorOptions, {
                events,
                wysiwyg,
                markup,
                markupState: editorMarkupState,
                tabFocusMode,
            }),
        [editorOptions, events, wysiwyg, markup, editorMarkupState, tabFocusMode],
    );

    useLayoutEffect(() => {
        function onToolbarAction({editorMode, id}: {editorMode: MarkdownEditorMode; id: string}) {
            globalLogger.action({mode: editorMode, source: 'toolbar', action: id});
            editor.logger.action({mode: editorMode, source: 'toolbar', action: id});
        }

        editor.on('toolbar-action', onToolbarAction);
        return () => {
            editor.off('toolbar-action', onToolbarAction);
            editor.destroy();
        };
    }, [editor]);
    return editor;
}

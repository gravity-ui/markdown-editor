import {useLayoutEffect, useMemo} from 'react';

import {createTabFocusModeExtension} from 'src/extensions/behavior/TabFocusMode';
import {Logger2, globalLogger} from 'src/logger';
import {ReactRenderStorage} from 'src/modules/react-renderer';
import {DirectiveSyntaxContext} from 'src/utils/directive';
import {SafeEventEmitter} from 'src/utils/event-emitter';

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
    } = useMemo(() => {
        const logger = props.logger ?? new Logger2();
        const {markupConfig = {}, wysiwygConfig = {}} = props;
        const extraWysiwygExtensions = wysiwygConfig.extensions;
        const extensionOptions = wysiwygConfig.extensionOptions;
        const tabFocus = createTabFocusModeExtension({
            defaultMode: props.initial?.tabFocusMode,
        });
        const options: EditorOptions = {
            ...props,
            markupConfig: {
                ...markupConfig,
                extensions: [tabFocus.markup, ...(markupConfig.extensions ?? [])],
            },
            wysiwygConfig: {
                ...wysiwygConfig,
                extensions: (builder) => {
                    builder.use(tabFocus.wysiwyg);
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
            getInitialMarkup: () => markupState.markup,
            events: new SafeEventEmitter<EditorEventMap>({
                onError: (error) => {
                    logger.error(error);
                    globalLogger.error(error);
                },
            }),
        };
    }, deps);
    const wysiwyg = useWysiwygCore(editorOptions, events, getInitialMarkup);
    const markup = useMarkupCore(editorOptions, events, getInitialMarkup);
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

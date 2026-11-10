import {useLayoutEffect, useMemo} from 'react';

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
    } = useMemo(() => {
        const logger = props.logger ?? new Logger2();
        const options: EditorOptions = {
            ...props,
            logger,
            preset: props.preset ?? 'full',
            renderStorage: new ReactRenderStorage(),
            directiveSyntax: new DirectiveSyntaxContext(props.experimental?.directiveSyntax),
        };
        const markupState: EditorMarkupState = {markup: props.initial?.markup ?? ''};
        return {
            options,
            markupState,
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
            }),
        [editorOptions, events, wysiwyg, markup, editorMarkupState],
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

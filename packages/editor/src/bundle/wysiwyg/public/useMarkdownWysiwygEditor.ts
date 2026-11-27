import {type DependencyList, useMemo} from 'react';

import {Logger2, globalLogger} from 'src/logger';
import {ReactRenderStorage} from 'src/modules/react-renderer';
import {DirectiveSyntaxContext} from 'src/utils/directive';
import {SafeEventEmitter} from 'src/utils/event-emitter';

import type {EditorEventMap} from '../../shared/events';
import {useEditorLifecycle} from '../../shared/useEditorLifecycle';
import {WysiwygEditorBinding} from '../binding';
import type {WysiwygCoreOptions} from '../types';
import {useWysiwygCore} from '../useWysiwygCore';

import type {MarkdownWysiwygEditorInstance, MarkdownWysiwygEditorOptions} from './types';

export function useMarkdownWysiwygEditor(
    options: MarkdownWysiwygEditorOptions,
    deps: DependencyList = [],
): MarkdownWysiwygEditorInstance {
    // The caller controls when options are captured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const captured = useMemo(() => captureOptions(options), deps);
    const core = useWysiwygCore(captured.options, captured.events, captured.getInitialMarkup);
    const owner = useMemo(
        () =>
            new WysiwygEditorBinding(
                captured.options,
                captured.events,
                core,
                captured.toolbarVisible,
            ),
        [captured, core],
    );

    useEditorLifecycle(owner);
    return owner.api;
}

function captureOptions(options: MarkdownWysiwygEditorOptions) {
    const logger = options.logger ?? new Logger2();
    const markup = options.initial?.markup ?? '';
    const coreOptions: WysiwygCoreOptions = {
        ...options,
        logger,
        preset: options.preset ?? 'full',
        renderStorage: new ReactRenderStorage(),
        directiveSyntax: new DirectiveSyntaxContext(options.experimental?.directiveSyntax),
    };
    return {
        options: coreOptions,
        toolbarVisible: options.initial?.toolbarVisible ?? true,
        getInitialMarkup: () => markup,
        events: new SafeEventEmitter<EditorEventMap>({
            onError: (error) => {
                logger.error(error);
                globalLogger.error(error);
            },
        }),
    };
}

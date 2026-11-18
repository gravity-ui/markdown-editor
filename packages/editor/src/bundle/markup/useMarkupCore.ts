import {useMemo} from 'react';

import type {EditorView} from '@codemirror/view';

import type {MarkupString} from 'src/common';

import type {ModeEvents} from '../shared/events';

import {MarkupCore} from './MarkupCore';
import type {MarkupCoreOptions} from './types';

/** @internal */
export function useMarkupCore(
    options: MarkupCoreOptions,
    events: ModeEvents,
    getInitialMarkup: () => MarkupString,
    initializeEditor?: (view: EditorView) => void,
): MarkupCore {
    return useMemo(
        () => new MarkupCore(options, events, getInitialMarkup, initializeEditor),
        [options, events, getInitialMarkup, initializeEditor],
    );
}

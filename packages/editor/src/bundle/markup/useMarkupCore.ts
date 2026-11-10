import {useMemo} from 'react';

import type {MarkupString} from 'src/common';

import type {ModeEvents} from '../shared/events';

import {MarkupCore} from './MarkupCore';
import type {MarkupCoreOptions} from './types';

/** @internal */
export function useMarkupCore(
    options: MarkupCoreOptions,
    events: ModeEvents,
    getInitialMarkup: () => MarkupString,
): MarkupCore {
    return useMemo(
        () => new MarkupCore(options, events, getInitialMarkup),
        [options, events, getInitialMarkup],
    );
}

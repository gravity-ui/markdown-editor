import type {Emitter, Receiver} from 'src/utils/event-emitter';

import type {EventMap} from '../events';

/** @internal */
export interface EditorEventMap extends EventMap {
    rerender: null;
    'rerender-toolbar': null;
    'cm-scroll': {event: Event};
}

/** @internal */
export type ModeEvents = Emitter<EditorEventMap> & Receiver<EditorEventMap>;

import type {EditorState} from 'prosemirror-state';

import type {Logger2} from '../../logger';
import {Facet} from '../../utils/facet';

/** @internal */
export const LoggerFacet = Facet.define<Logger2, Logger2>({
    combine: (value) => value[0],
    static: true,
});

export const getLoggerFromState = (state: EditorState): Logger2 => LoggerFacet.getState(state)!;

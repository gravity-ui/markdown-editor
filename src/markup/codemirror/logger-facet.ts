import {Facet} from '@codemirror/state';

import type {Logger2} from '../../logger';

export const LoggerFacet = Facet.define<Logger2, Logger2>({
    combine: (value) => value[0],
    static: true,
});

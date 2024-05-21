import {Facet} from '@codemirror/state';

import type {ReactRenderStorage} from '../../extensions';

export const ReactRendererFacet = Facet.define<ReactRenderStorage, ReactRenderStorage>({
    combine: (value) => value[0],
    static: true,
});

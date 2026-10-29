import {Facet} from '@codemirror/state';

export const LinkifyFacet = Facet.define<boolean, boolean>({
    combine: ([enabled]) => enabled ?? false,
    static: true,
});

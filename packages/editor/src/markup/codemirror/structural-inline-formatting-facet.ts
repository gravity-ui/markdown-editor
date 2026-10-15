import {Facet} from '@codemirror/state';

export const StructuralInlineFormattingFacet = Facet.define<boolean, boolean>({
    // TODO: Enable structural inline formatting by default in a future release.
    combine: ([enabled]) => enabled ?? false,
    static: true,
});

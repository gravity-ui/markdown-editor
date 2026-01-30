import {Facet} from '@codemirror/state';

import type {DirectiveSyntaxContext} from '../../utils/directive';

export const DirectiveSyntaxFacet = Facet.define<
    DirectiveSyntaxContext,
    Omit<DirectiveSyntaxContext, 'shouldSerializeToDirective'>
>({
    combine: ([context]) => context,
    static: true,
});

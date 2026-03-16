import type {EditorState} from 'prosemirror-state';

import {Facet} from '../../utils/facet';
import type {Parser} from '../types/parser';

/** @internal */
export const ParserFacet = Facet.define<Parser, Parser>({
    combine: (value) => value[0],
    static: true,
});

export const getParserFromState = (state: EditorState): Parser => ParserFacet.getState(state)!;

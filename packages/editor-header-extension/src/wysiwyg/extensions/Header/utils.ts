import type {Serializer} from '@gravity-ui/markdown-editor/core';
import type {EditorState} from '@gravity-ui/markdown-editor/pm/state';

import {headerNodeType} from './HeaderSpecs';

export function headerAt(state: EditorState, pos: number) {
    const node = state.doc.nodeAt(pos);
    return node?.type === headerNodeType(state.schema) ? node : null;
}

/** The Markdown of the banner at `pos`, as it is saved in the document. */
export function headerMarkup(serializer: Serializer, state: EditorState, pos: number) {
    const node = headerAt(state, pos);
    return node ? serializer.serialize(state.doc.type.create(null, node)) : null;
}

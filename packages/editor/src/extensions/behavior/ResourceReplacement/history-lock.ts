import type {EditorState} from 'prosemirror-state';

import {resourceReplacementKey} from './plugin-key';

/** External history must check this before mutating its document, including before resolve starts. */
export function isProseMirrorHistoryLocked(state: EditorState): boolean {
    return Boolean(resourceReplacementKey.getState(state)?.length);
}

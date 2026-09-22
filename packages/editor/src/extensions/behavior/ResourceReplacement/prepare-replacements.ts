import type {EditorState} from 'prosemirror-state';

import {getParserFromState} from '../../../core/utils/parser';
import {replaceNodeResources} from '../../../modules/resource-replacement/replace-node-resources';

import {describeResource} from './collect-resources';
import {resolvedResourceMeta} from './meta';

export function prepareResourceReplacementTransaction(
    state: EditorState,
    replacements: ReadonlyMap<string, string>,
    requestedUrlKeys: ReadonlySet<string> = new Set(),
) {
    const tr = state.tr;
    replaceNodeResources(
        tr,
        replacements,
        describeResource,
        getParserFromState(state),
        requestedUrlKeys,
    );
    return tr.docChanged
        ? tr.setMeta('addToHistory', false).setMeta(resolvedResourceMeta, true)
        : null;
}

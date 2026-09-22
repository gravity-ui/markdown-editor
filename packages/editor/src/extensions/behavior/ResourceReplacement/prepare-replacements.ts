import type {EditorState} from 'prosemirror-state';

import {getParserFromState} from '../../../core/utils/parser';
import {resourceKey} from '../../../modules/resource-replacement/controller.utils';
import {isUrlResource, prepareResourceUrl} from '../../../modules/resource-replacement/urls';

import {describeResource, isCodeNode} from './collect-resources';
import {resolvedResourceMeta} from './meta';

export function prepareResourceReplacementTransaction(
    state: EditorState,
    replacements: ReadonlyMap<string, string>,
    requestedUrlKeys: ReadonlySet<string> = new Set(),
) {
    const urls = new Map<string, string>();
    for (const [key, value] of replacements) {
        if (requestedUrlKeys.has(key))
            urls.set(key, prepareResourceUrl(getParserFromState(state), value));
    }
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
        if (isCodeNode(node)) return false;
        const resource = describeResource(node);
        if (resource) {
            const key = resourceKey({
                kind: resource.kind,
                value: node.attrs[resource.valueAttribute],
            });
            let value = replacements.get(key);
            if (value !== undefined && isUrlResource(node.type.name, resource)) {
                const parser = getParserFromState(state);
                if (!parser.validateLink(node.attrs[resource.valueAttribute])) return true;
                value = urls.get(key) ?? prepareResourceUrl(parser, value);
                urls.set(key, value);
            }
            if (value !== undefined && value !== node.attrs[resource.valueAttribute])
                tr.setNodeAttribute(pos, resource.valueAttribute, value);
        }
        return true;
    });
    return tr.docChanged
        ? tr.setMeta('addToHistory', false).setMeta(resolvedResourceMeta, true)
        : null;
}

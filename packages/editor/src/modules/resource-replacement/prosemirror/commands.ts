import type {Command, EditorState} from 'prosemirror-state';

import {getParserFromState} from '../../../core/utils/parser';
import type {ResourceReplacementHost} from '../host';
import {replaceResourceId} from '../tracking';

import {describeResource, encodeResourceUrl} from './document-utils';
import {resolvedResourceMeta} from './key';

export function resourceReplacementTransaction(state: EditorState, host: ResourceReplacementHost) {
    if (!host.active) return null;
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
        const resource = describeResource(node);
        const attr = resource?.urlAttribute;
        const target = host.getTarget(node.attrs[replaceResourceId]);
        if (
            attr &&
            target?.replacement !== undefined &&
            target.resource.kind === resource?.kind &&
            node.attrs[attr] === target.resource.path
        ) {
            const parser = getParserFromState(state);
            if (!parser.validateLink(target.replacement)) throw new Error('Invalid resource URL');
            const url = encodeResourceUrl(parser, target.replacement);
            // AttrStep preserves the node's other attributes and the selection.
            if (node.attrs[attr] !== url) tr.setNodeAttribute(pos, attr, url);
        }
        return true;
    });
    return tr.docChanged
        ? tr.setMeta('addToHistory', false).setMeta(resolvedResourceMeta, true)
        : null;
}

export function applyResolvedResources(host: ResourceReplacementHost): Command {
    return (state, dispatch, view) => {
        const tr = resourceReplacementTransaction(state, host);
        if (!tr || (view && (!view.editable || view.isDestroyed))) return false;
        dispatch?.(tr);
        return true;
    };
}

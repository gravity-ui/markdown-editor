import type {Node} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../core/ExtensionBuilder';
import {replaceResourceId} from '../tracking';

import type {ResourceReplacementOptions} from './options';
import {resourceReplacementPlugin} from './plugin';

export const ResourceReplacement: ExtensionAuto<ResourceReplacementOptions> = (
    builder,
    options,
) => {
    for (const nodeType of builder.nodeSpecNames()) {
        builder.overrideNodeSpec(nodeType, (spec) => {
            const resource = spec.resource;
            if (!resource) return spec;
            if (!resource.kind || !resource.urlAttribute)
                throw new Error(`Invalid resource description: ${nodeType}`);
            if (!spec.attrs?.[resource.urlAttribute]) {
                throw new Error(
                    `Missing resource URL attribute: ${nodeType}.${resource.urlAttribute}`,
                );
            }
            const toDOM = spec.toDOM;
            return {
                ...spec,
                attrs: {...spec.attrs, [replaceResourceId]: {default: null}},
                ...(toDOM && {
                    toDOM: (node: Node) => toDOM.call(spec, withoutResourceId(node)),
                }),
            };
        });
        builder.overrideNodeSerializerSpec(
            nodeType,
            (serialize) => (state, node, parent, index) =>
                serialize(
                    state,
                    node.type.spec.resource ? withoutResourceId(node) : node,
                    parent,
                    index,
                ),
        );
    }
    builder.addPlugin(() => resourceReplacementPlugin(options), builder.Priority.Lowest);
};

/** Give serializers a private copy without exposing tracking attributes or mutating editor state. */
function withoutResourceId(node: Node): Node {
    const attrs = {...node.attrs};
    delete attrs[replaceResourceId];
    // NodeType.create restores schema defaults, so replace attrs on the new node only.
    return Object.assign(node.type.create(node.attrs, node.content, node.marks), {attrs});
}

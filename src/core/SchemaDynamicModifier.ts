import type {NodeSpec} from 'prosemirror-model';

export type TokenAttrs = {[name: string]: unknown};

/**
 * Class SchemaDynamicModifier
 *
 * Provides a mechanism for dynamic modification of schema node attributes:
 *
 *    - `allowedAttrs`: A list of additional attributes to include in the ProseMirror schema with default values.
 *      When specified, these attributes are added to the schema and preserved during processing.
 *
 * Example:
 * ```ts
 * const dynamicModifier = new SchemaDynamicModifier({
 *     paragraph: {
 *         allowedAttrs: ['data-paragraph'],
 *     },
 * });
 * ```
 */

/** @internal */
export interface NodeSpecProcessor {
    allowedAttrs?: string[];
}

/** @internal */
export interface SchemaDynamicModifierConfig {
    [elementType: string]: NodeSpecProcessor;
}

/** @internal */
export class SchemaDynamicModifier {
    private nodeSpecsProcessors: Map<string, NodeSpecProcessor>;

    constructor(config: SchemaDynamicModifierConfig) {
        this.nodeSpecsProcessors = new Map(Object.entries(config));
    }

    processNodeSpec(name: string, nodeSpec: NodeSpec): NodeSpec {
        let updatedSpec = nodeSpec;

        this.nodeSpecsProcessors.forEach((processor, elementType) => {
            if (
                name === elementType &&
                processor.allowedAttrs &&
                processor.allowedAttrs.length > 0 &&
                nodeSpec
            ) {
                updatedSpec = {
                    ...nodeSpec,
                    attrs: {
                        ...nodeSpec.attrs,
                        ...processor.allowedAttrs.reduce(
                            (acc, key) => {
                                acc[key] = {default: null};
                                return acc;
                            },
                            {} as Record<string, any>,
                        ),
                    },
                };
            }
        });

        return updatedSpec;
    }
}

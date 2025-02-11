import {MarkSpec, NodeSpec, Schema} from 'prosemirror-model';

import {SchemaDynamicModifier} from './SchemaDynamicModifier';

export class SchemaSpecRegistry {
    #spec: {
        topNode?: string;
        nodes: Record<string, NodeSpec>;
        marks: Record<string, MarkSpec>;
    };
    #dynamicModifier?: SchemaDynamicModifier;

    constructor(topNode?: string, dynamicModifier?: SchemaDynamicModifier) {
        this.#spec = {topNode, nodes: {}, marks: {}};
        this.#dynamicModifier = dynamicModifier;
    }

    addNode(name: string, spec: NodeSpec) {
        const modifiedSpec = this.#dynamicModifier
            ? this.#dynamicModifier.processNodeSpec(name, spec)
            : spec;

        this.#spec.nodes[name] = modifiedSpec;
        return this;
    }

    addMark(name: string, spec: MarkSpec) {
        this.#spec.marks[name] = spec;
        return this;
    }

    createSchema() {
        return new Schema(this.#spec);
    }
}

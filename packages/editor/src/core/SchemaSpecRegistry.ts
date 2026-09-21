import {type MarkSpec, type NodeSpec, Schema} from 'prosemirror-model';

import type {SchemaDynamicModifier} from './SchemaDynamicModifier';

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

    get topNodeName(): string {
        return this.#spec.topNode || 'doc';
    }

    hasNode(name: string): boolean {
        return Object.hasOwn(this.#spec.nodes, name);
    }

    hasMark(name: string): boolean {
        return Object.hasOwn(this.#spec.marks, name);
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

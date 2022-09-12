import {MarkSpec, NodeSpec, Schema} from 'prosemirror-model';

export class SchemaSpecRegistry {
    #spec: {
        topNode?: string;
        nodes: Record<string, NodeSpec>;
        marks: Record<string, MarkSpec>;
    };

    constructor(topNode?: string) {
        this.#spec = {topNode, nodes: {}, marks: {}};
    }

    addNode(name: string, spec: NodeSpec) {
        this.#spec.nodes[name] = spec;
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

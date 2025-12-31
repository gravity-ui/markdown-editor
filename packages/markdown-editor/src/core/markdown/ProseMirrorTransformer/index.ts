import {Node} from 'prosemirror-model';

type PMNodeJSON = {
    type: string;
    attrs?: Record<string, any>;
    content?: PMNodeJSON[];
    text?: string;
};

export type TransformFn = (node: PMNodeJSON) => void;

export class ProseMirrorTransformer {
    private readonly _transformers: TransformFn[];

    constructor(fns: TransformFn[]) {
        this._transformers = fns;
    }

    transform(doc: Node): Node {
        const docJSON = doc.toJSON();
        this.transformJSON(docJSON);
        return Node.fromJSON(doc.type.schema, docJSON);
    }

    transformJSON(node: PMNodeJSON) {
        for (const fn of this._transformers) {
            fn(node);
        }
        if (node.content) {
            for (const child of node.content) {
                this.transformJSON(child);
            }
        }
    }
}

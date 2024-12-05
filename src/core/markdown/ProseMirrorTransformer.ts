import {Node} from 'prosemirror-model';

type PMNodeJSON = {
    type: string;
    attrs?: Record<string, any>;
    content?: PMNodeJSON[];
    text?: string;
};

type TranformFn = (node: PMNodeJSON) => void;

class ProseMirrorTransformer {
    private readonly _transformers: TranformFn[];

    constructor(...fns: TranformFn[]) {
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

const transformEmptyParagraph: TranformFn = (node) => {
    if (node.type !== 'paragraph') return;
    if (node.content?.length !== 1) return;
    if (node.content[0]?.type !== 'text') return;
    if (node.content[0].text === String.fromCharCode(160)) delete node.content;
};

export const pmTransformer = new ProseMirrorTransformer(transformEmptyParagraph);

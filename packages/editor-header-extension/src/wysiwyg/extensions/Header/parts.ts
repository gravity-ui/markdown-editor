import type {Node, NodeType, Schema} from '@gravity-ui/markdown-editor/pm/model';

/** The order of the parts inserted by the settings switches. */
export const headerPartOrder = ['image', 'title', 'content'] as const;

export type HeaderPart = (typeof headerPartOrder)[number];
export type HeaderParts = Record<HeaderPart, boolean>;

export type FoundNode = {node: Node; pos: number};
export type FoundParts = Partial<Record<HeaderPart, FoundNode>>;

/**
 * Marks a node type as a banner part: `headerPart` in its node spec.
 * The settings switch of the part inserts and removes the node.
 */
export type HeaderPartSpec = {
    part: HeaderPart;
    /** A new block of the part. */
    create: (type: NodeType) => Node | null | undefined;
    /** The block of the part made from the only paragraph of the banner, to keep its text. */
    adopt?: (paragraph: Node, type: NodeType) => Node | null | undefined;
};

export const headerPartSpec = (type: NodeType): HeaderPartSpec | undefined => type.spec.headerPart;

const partTypesBySchema = new WeakMap<Schema, Partial<Record<HeaderPart, NodeType>>>();

/** The node types of the parts in the schema; a part without a node type is not available. */
export function headerPartTypes(schema: Schema) {
    let types = partTypesBySchema.get(schema);
    if (!types) {
        types = {};
        for (const type of Object.values(schema.nodes)) {
            const spec = headerPartSpec(type);
            if (spec) types[spec.part] ??= type;
        }
        partTypesBySchema.set(schema, types);
    }
    return types;
}

/** The first block of each part among the children of the banner at `pos`. */
export function findParts(header: Node, pos: number): FoundParts {
    const parts: FoundParts = {};
    header.forEach((node, offset) => {
        const spec = headerPartSpec(node.type);
        if (spec) parts[spec.part] ??= {node, pos: pos + 1 + offset};
    });
    return parts;
}

/** The last found part that goes before the part with the index `end` in `headerPartOrder`. */
export function lastPartBefore(parts: FoundParts, end: number = headerPartOrder.length) {
    const part = headerPartOrder
        .slice(0, end)
        .reverse()
        .find((name) => parts[name]);
    return part && parts[part];
}

export function headerParts(header: Node): HeaderParts {
    const {image, title, content} = findParts(header, 0);
    return {image: Boolean(image), title: Boolean(title), content: Boolean(content)};
}

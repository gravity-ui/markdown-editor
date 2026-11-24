import type {Node, NodeType, Schema} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeWithPos} from '@gravity-ui/markdown-editor/pm/utils';

/** The order of the parts inserted by the settings switches. */
export const bannerPartOrder = ['image', 'title', 'content'] as const;

export type BannerPart = (typeof bannerPartOrder)[number];
export type BannerParts = Record<BannerPart, boolean>;

export type FoundParts = Partial<Record<BannerPart, NodeWithPos>>;

/**
 * Marks a node type as a banner part: `bannerPart` in its node spec.
 * The settings switch of the part inserts and removes the node.
 */
export type BannerPartSpec = {
    part: BannerPart;
    /** A new block of the part. */
    create: (type: NodeType) => Node | null | undefined;
    /** The block of the part made from the only paragraph of the banner, to keep its text. */
    adopt?: (paragraph: Node, type: NodeType) => Node | null | undefined;
};

export const bannerPartSpec = (type: NodeType): BannerPartSpec | undefined => type.spec.bannerPart;

const partTypesBySchema = new WeakMap<Schema, Partial<Record<BannerPart, NodeType>>>();

/** The node types of the parts in the schema; a part without a node type is not available. */
export function bannerPartTypes(schema: Schema) {
    let types = partTypesBySchema.get(schema);
    if (!types) {
        types = {};
        for (const type of Object.values(schema.nodes)) {
            const spec = bannerPartSpec(type);
            if (spec) types[spec.part] ??= type;
        }
        partTypesBySchema.set(schema, types);
    }
    return types;
}

/** The first block of each part among the children of the banner at `pos`. */
export function findParts(banner: Node, pos: number): FoundParts {
    const parts: FoundParts = {};
    banner.forEach((node, offset) => {
        const spec = bannerPartSpec(node.type);
        if (spec) parts[spec.part] ??= {node, pos: pos + 1 + offset};
    });
    return parts;
}

/** The last found part that goes before the part with the index `end` in `bannerPartOrder`. */
export function lastPartBefore(parts: FoundParts, end: number) {
    const part = bannerPartOrder
        .slice(0, end)
        .reverse()
        .find((name) => parts[name]);
    return part && parts[part];
}

export function bannerParts(banner: Node): BannerParts {
    const {image, title, content} = findParts(banner, 0);
    return {image: Boolean(image), title: Boolean(title), content: Boolean(content)};
}

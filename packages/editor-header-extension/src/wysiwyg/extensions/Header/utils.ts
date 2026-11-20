import type {Node} from '@gravity-ui/markdown-editor/pm/model';

import {headerImageNodeName} from '../HeaderImage/HeaderImageSpecs';

export type HeaderPart = 'image';
export type HeaderParts = Record<HeaderPart, boolean>;

type FoundNode = {node: Node; pos: number};
export type FoundParts = Partial<Record<HeaderPart, FoundNode>>;

const partByName: ReadonlyMap<string, HeaderPart> = new Map([[headerImageNodeName, 'image']]);

export function findParts(header: Node, pos: number): FoundParts {
    const parts: FoundParts = {};
    header.forEach((node, offset) => {
        const part = partByName.get(node.type.name);
        if (part) parts[part] ??= {node, pos: pos + 1 + offset};
    });
    return parts;
}

export function headerParts(header: Node): HeaderParts {
    const {image} = findParts(header, 0);
    return {image: Boolean(image)};
}

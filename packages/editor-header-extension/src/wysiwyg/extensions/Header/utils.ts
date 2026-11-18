import type {Node} from '@gravity-ui/markdown-editor/pm/model';

import {headerContentNodeName} from '../HeaderContent/HeaderContentSpecs';

export const headerPartOrder = ['content'] as const;

export type HeaderPart = (typeof headerPartOrder)[number];
export type HeaderParts = Record<HeaderPart, boolean>;

export type FoundNode = {node: Node; pos: number};
export type FoundParts = Partial<Record<HeaderPart, FoundNode>>;

const partByName: ReadonlyMap<string, HeaderPart> = new Map([[headerContentNodeName, 'content']]);

export function findParts(header: Node, pos: number): FoundParts {
    const parts: FoundParts = {};
    header.forEach((node, offset) => {
        const part = partByName.get(node.type.name);
        if (part) parts[part] ??= {node, pos: pos + 1 + offset};
    });
    return parts;
}

export function lastPartBefore(parts: FoundParts, end: number = headerPartOrder.length) {
    const part = headerPartOrder
        .slice(0, end)
        .reverse()
        .find((name) => parts[name]);
    return part && parts[part];
}

export function headerParts(header: Node): HeaderParts {
    const {content} = findParts(header, 0);
    return {content: Boolean(content)};
}

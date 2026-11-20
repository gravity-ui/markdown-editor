import type {Node} from '@gravity-ui/markdown-editor/pm/model';

import {headerTitleNodeName} from '../HeaderTitle/HeaderTitleSpecs';

export const headerPartOrder = ['title'] as const;

export type HeaderPart = (typeof headerPartOrder)[number];
export type HeaderParts = Record<HeaderPart, boolean>;

export type FoundNode = {node: Node; pos: number};
export type FoundParts = Partial<Record<HeaderPart, FoundNode>>;

const partByName: ReadonlyMap<string, HeaderPart> = new Map([[headerTitleNodeName, 'title']]);

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
    const {title} = findParts(header, 0);
    return {title: Boolean(title)};
}

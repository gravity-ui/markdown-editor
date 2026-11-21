import type {Node} from '@gravity-ui/markdown-editor/pm/model';

import {bannerContentNodeName} from '../BannerContent/BannerContentSpecs';
import {bannerImageNodeName} from '../BannerImage/BannerImageSpecs';
import {bannerTitleNodeName} from '../BannerTitle/BannerTitleSpecs';
import {isButton, isButtonRow} from '../Button/ButtonSpecs';

export const bannerPartOrder = ['image', 'title', 'content'] as const;

export type BannerPart = (typeof bannerPartOrder)[number];
export type BannerParts = Record<BannerPart, boolean> & {buttons: number};

export type FoundNode = {node: Node; pos: number};
export type FoundParts = Partial<Record<BannerPart, FoundNode>> & {
    buttons: (FoundNode & {row: FoundNode})[];
};

const partByName: ReadonlyMap<string, BannerPart> = new Map([
    [bannerImageNodeName, 'image'],
    [bannerTitleNodeName, 'title'],
    [bannerContentNodeName, 'content'],
]);

export function findParts(banner: Node, pos: number): FoundParts {
    const parts: FoundParts = {buttons: []};
    banner.forEach((node, offset) => {
        const found = {node, pos: pos + 1 + offset};
        const part = partByName.get(node.type.name);
        if (part) {
            parts[part] ??= found;
        } else if (isButtonRow(node)) {
            node.forEach((button, buttonOffset) => {
                if (!isButton(button)) return;
                parts.buttons.push({node: button, pos: found.pos + 1 + buttonOffset, row: found});
            });
        }
    });
    return parts;
}

export function findAllParts(banner: Node, pos: number, part: BannerPart): FoundNode[] {
    const found: FoundNode[] = [];
    banner.forEach((node, offset) => {
        if (partByName.get(node.type.name) === part) found.push({node, pos: pos + 1 + offset});
    });
    return found;
}

export function lastPartBefore(parts: FoundParts, end: number = bannerPartOrder.length) {
    const part = bannerPartOrder
        .slice(0, end)
        .reverse()
        .find((name) => parts[name]);
    return part && parts[part];
}

export function bannerParts(banner: Node): BannerParts {
    const {image, title, content, buttons} = findParts(banner, 0);
    return {
        image: Boolean(image),
        title: Boolean(title),
        content: Boolean(content),
        buttons: buttons.length,
    };
}

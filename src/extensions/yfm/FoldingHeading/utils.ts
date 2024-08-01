import type {Node} from 'prosemirror-model';
import type {Selection} from 'prosemirror-state';

import {YfmHeadingAttr, headingNodeName} from './const';

export {headingType} from '../../markdown/Heading/HeadingSpecs';

export const insideHeading = ({$anchor, $head}: Selection): boolean =>
    $anchor.sameParent($head) && isHeading($head.parent);

export const hasFolding = (sel: Selection) =>
    insideHeading(sel) && sel.$head.parent.attrs[YfmHeadingAttr.Folding] !== null;

export function isHeading(node: Node): boolean {
    return node.type.name === headingNodeName;
}

export function isFoldingHeading(node: Node): boolean {
    return isHeading(node) && typeof node.attrs[YfmHeadingAttr.Folding] === 'boolean';
}

export function isFoldedHeading(node: Node): boolean {
    return isHeading(node) && node.attrs[YfmHeadingAttr.Folding] === true;
}

export function isUnfoldedHeading(node: Node): boolean {
    return isHeading(node) && node.attrs[YfmHeadingAttr.Folding] === false;
}

export function parseLevel(node: Node): number {
    return Number.parseInt(node.attrs[YfmHeadingAttr.Level], 10);
}

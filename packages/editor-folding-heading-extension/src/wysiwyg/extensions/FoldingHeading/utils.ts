import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {Selection} from '@gravity-ui/markdown-editor/pm/state';

import {FoldingHeadingAttr, YfmHeadingAttr, headingNodeName} from './const';

export {headingType} from '@gravity-ui/markdown-editor/specs';

export const insideHeading = ({$anchor, $head}: Selection): boolean =>
    $anchor.sameParent($head) && isHeading($head.parent);

export const hasFolding = (sel: Selection) =>
    insideHeading(sel) && sel.$head.parent.attrs[FoldingHeadingAttr.Folding] !== null;

export function isHeading(node: Node): boolean {
    return node.type.name === headingNodeName;
}

export function isFoldingHeading(node: Node): boolean {
    return isHeading(node) && typeof node.attrs[FoldingHeadingAttr.Folding] === 'boolean';
}

export function isFoldedHeading(node: Node): boolean {
    return isHeading(node) && node.attrs[FoldingHeadingAttr.Folding] === true;
}

export function isUnfoldedHeading(node: Node): boolean {
    return isHeading(node) && node.attrs[FoldingHeadingAttr.Folding] === false;
}

export function parseLevel(node: Node): number {
    return Number.parseInt(node.attrs[YfmHeadingAttr.Level], 10);
}

import {Fragment, type Node, type Schema} from 'prosemirror-model';
import {Plugin, TextSelection, type Transaction} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {hasParentNode} from 'prosemirror-utils';

import {isListItemNode, isListNode, liType} from '../utils';

const MAX_COLLAPSE_DEPTH = 100;

/**
 * Collapses parasitic nested lists inside list items
 *
 * Converts structures where a list item starts with
 * a nested list into a flat list structure
 *
 * IMPORTANT: must be registered AFTER MergeListsPlugin.
 * Collapsing may create adjacent lists that require merging
 */
export const collapseListsPlugin = () =>
    new Plugin({
        appendTransaction(trs, oldState, newState) {
            // early exit if document unchanged
            const docChanged = trs.some((tr) => tr.docChanged);
            if (!docChanged) {
                return null;
            }

            // early exit if not inside a list
            const hasParentList =
                hasParentNode(isListNode)(newState.selection) ||
                hasParentNode(isListNode)(oldState.selection);
            if (!hasParentList) {
                return null;
            }

            const {tr} = newState;

            // collapse of parasitic nested lists
            const lastCollapsePos = collapseAllNestedListItems(tr);

            // restore cursor position
            if (lastCollapsePos !== null) {
                const cursorPos = findClosestTextNodePos(tr.doc, lastCollapsePos);
                if (cursorPos !== null) {
                    tr.setSelection(TextSelection.create(tr.doc, cursorPos));
                }
            }

            return tr.docChanged ? tr : null;
        },
    });

interface Replacement {
    from: number;
    to: number;
    content: Fragment;
}

/**
 * Finds list items with parasitic nesting, collapses them recursively,
 * and applies replacements in reverse document order
 */
export function collapseAllNestedListItems(tr: Transaction): number | null {
    const replacements: Replacement[] = [];
    const schema = tr.doc.type.schema;

    // skipUntil prevents re-processing children that were already collapsed
    // by the recursive call in collapseListItemContent
    let skipUntil = -1;

    tr.doc.descendants((node, pos) => {
        if (pos < skipUntil) return false;

        if (!isListItemNode(node)) {
            return true;
        }

        const {firstChild} = node;
        if (!firstChild || !isListNode(firstChild)) {
            return true;
        }

        const collapsedContent = collapseListItemContent(node, schema, 0);
        if (collapsedContent === null) {
            return true;
        }

        replacements.push({
            from: pos,
            to: pos + node.nodeSize,
            content: collapsedContent,
        });
        skipUntil = pos + node.nodeSize;

        return false;
    });

    if (replacements.length === 0) {
        return null;
    }

    // apply from end to start so earlier positions stay valid
    for (let i = replacements.length - 1; i >= 0; i--) {
        const {from, to, content} = replacements[i];
        tr.replaceWith(from, to, content);
    }

    // map the original end of the last replacement to its post-edit position
    const last = replacements[replacements.length - 1];
    return tr.mapping.map(last.to);
}

/**
 * Recursively collapses a list item with parasitic nesting
 * into a Fragment of flat list items
 *
 * A parasitically nested list item has a list as its first child
 * (instead of a paragraph)
 */
function collapseListItemContent(itemNode: Node, schema: Schema, depth: number): Fragment | null {
    const {firstChild} = itemNode;
    if (!firstChild || !isListNode(firstChild)) {
        return null;
    }
    if (depth >= MAX_COLLAPSE_DEPTH) {
        return null;
    }

    // .slice(1) = all children except firstChild
    const remaining = itemNode.content.content.slice(1);

    let result = Fragment.empty;
    firstChild.forEach((child) => {
        if (isListItemNode(child)) {
            const collapsed = collapseListItemContent(child, schema, depth + 1);
            result = result.append(collapsed ?? Fragment.from(child));
        } else {
            result = result.append(Fragment.from(child));
        }
    });

    if (remaining.length) {
        result = result.append(Fragment.from(liType(schema).create(null, remaining)));
    }

    return result;
}

/**
 * Finds the nearest text node position by searching forward then backward from pos
 */
export function findClosestTextNodePos(doc: Node, pos: number): number | null {
    const size = doc.content.size;
    if (size === 0) {
        return null;
    }

    const start = Math.max(0, Math.min(pos, size - 1));

    for (let fwd = start; fwd < size; fwd++) {
        if (doc.nodeAt(fwd)?.isText) {
            return fwd;
        }
    }
    for (let bwd = start - 1; bwd >= 0; bwd--) {
        if (doc.nodeAt(bwd)?.isText) {
            return bwd;
        }
    }

    return null;
}

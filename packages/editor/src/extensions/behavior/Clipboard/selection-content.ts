import type {Selection} from '#pm/state';

/**
 * @internal
 *
 * Like `selection.content()`, but smarter.
 * Copy a structure of complex nodes,
 * e.g. if select part of cut title it creates slice with yfm-cut –> yfm-cut-title -> selected text
 * it works well with simple nodes, but to handle cases as described above, custom logic needed
 */
export function getSelectionContent(sel: Selection) {
    const sharedDepth = sel.$from.sharedDepth(sel.$to.pos);
    const sharedNode = sel.$from.node(sharedDepth);
    const sharedNodeComplex = sharedNode.type.spec.complex;

    if (sharedNodeComplex && sharedNodeComplex !== 'leaf') {
        // Find the nearest ancestor with complex='root' to avoid
        // wrapping copied content in outer containers (blockquote, table cell, etc.)
        let rootDepth = sharedDepth;
        for (let d = sharedDepth; d >= 0; d--) {
            if (sel.$from.node(d).type.spec.complex === 'root') {
                rootDepth = d;
                break;
            }
        }

        // Slice from the parent of the root node so that the root node itself
        // (e.g. bullet_list) is included in the slice, but its outer containers are not.
        const parentDepth = Math.max(0, rootDepth - 1);
        const parentNode = sel.$from.node(parentDepth);
        const parentStart = sel.$from.start(parentDepth);
        return parentNode.slice(sel.$from.pos - parentStart, sel.$to.pos - parentStart, true);
    }

    return sel.$from.doc.slice(sel.$from.pos, sel.to, false);
}

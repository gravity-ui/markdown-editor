import type {Node, NodeType, Schema} from '@gravity-ui/markdown-editor/pm/model';
import type {Transaction} from '@gravity-ui/markdown-editor/pm/state';

import {bannerNodeType} from './Banner/BannerSpecs/const';
import {changedRange} from './changedRange';

function childrenOfType(node: Node | null | undefined, type: NodeType) {
    let count = 0;
    node?.forEach((child) => {
        if (child.type === type) count++;
    });
    return count;
}

/**
 * A banner keeps one child of `childType`: a change that adds a second one is rejected.
 * A banner that already has several, as loaded, stays editable.
 */
export const oneChildPerBanner =
    (childType: (schema: Schema) => NodeType) =>
    (tr: Transaction): boolean => {
        const range = tr.docChanged && changedRange(tr, 'after');
        if (!range) return true;
        const {schema} = tr.doc.type;
        const banner = bannerNodeType(schema);
        const child = childType(schema);
        const back = tr.mapping.invert();
        let single = true;
        tr.doc.nodesBetween(range.from, range.to, (node, pos) => {
            if (node.type !== banner) return !node.isTextblock;
            const count = childrenOfType(node, child);
            if (count > 1) {
                const before = tr.before.nodeAt(back.map(pos, 1));
                single &&= before?.type === banner && childrenOfType(before, child) >= count;
            }
            return single;
        });
        return single;
    };

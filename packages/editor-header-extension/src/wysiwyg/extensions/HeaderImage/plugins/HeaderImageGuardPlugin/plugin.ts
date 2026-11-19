import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin, type Transaction} from '@gravity-ui/markdown-editor/pm/state';

import {headerNodeType} from '../../../Header/HeaderSpecs/const';
import {headerImageNodeType} from '../../HeaderImageSpecs';

/** The range of the document after `tr` that its steps changed. */
function changedRange(tr: Transaction) {
    let from = -1;
    let to = -1;
    tr.mapping.maps.forEach((map, index) => {
        const later = tr.mapping.slice(index + 1);
        map.forEach((_oldStart, _oldEnd, start, end) => {
            const mappedStart = later.map(start, -1);
            from = from < 0 ? mappedStart : Math.min(from, mappedStart);
            to = Math.max(to, later.map(end, 1));
        });
    });
    return from < 0 ? null : {from, to: Math.max(from, to)};
}

function imageCount(header: Node) {
    let count = 0;
    header.forEach((child) => {
        if (child.type === headerImageNodeType(header.type.schema)) count++;
    });
    return count;
}

/** A banner keeps one image: a change that puts a second image into a banner is rejected. */
function keepsOneImage(tr: Transaction) {
    if (!tr.docChanged) return true;
    const range = changedRange(tr);
    if (!range) return true;
    const type = headerNodeType(tr.doc.type.schema);
    let kept = true;
    tr.doc.nodesBetween(range.from, range.to, (node) => {
        if (node.type === type && imageCount(node) > 1) kept = false;
        return kept && !node.isTextblock;
    });
    return kept;
}

export const headerImageGuardPlugin = () => new Plugin({filterTransaction: keepsOneImage});

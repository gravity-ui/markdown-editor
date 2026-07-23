import type {Parser} from '#core';
import type {Node as PmNode} from '#pm/model';
import {isTableNode} from 'src/table-utils';

export function detectMarkdown(text: string, parser: Parser): PmNode | null {
    if (!text.trim()) return null;

    try {
        const doc = parser.parse(text);
        return hasTableNode(doc) ? doc : null;
    } catch {
        return null;
    }
}

function hasTableNode(node: PmNode): boolean {
    let found = false;

    node.descendants((child) => {
        if (isTableNode(child)) found = true;
        return !found;
    });

    return found;
}

import type {Node} from '#pm/model';

import {CodeBlockNodeAttr} from '../CodeBlockSpecs';

export function isLineNumbersVisible(node: Node): boolean {
    return node.attrs[CodeBlockNodeAttr.ShowLineNumbers] === 'true';
}

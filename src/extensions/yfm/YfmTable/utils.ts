import type {Fragment, Node} from 'prosemirror-model';

export * from './YfmTableSpecs/utils';

export function getContentAsArray(node: Node | Fragment) {
    const content: {node: Node; offset: number}[] = [];
    node.forEach((node, offset) => {
        content.push({node, offset});
    });
    return content;
}

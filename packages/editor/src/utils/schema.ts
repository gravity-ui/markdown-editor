import {Node, type NodeType, type Schema} from 'prosemirror-model';

export const nodeTypeFactory = (nodeName: string) => (schema: Schema) => schema.nodes[nodeName];
export const markTypeFactory = (markName: string) => (schema: Schema) => schema.marks[markName];

export function isSameNodeType(a: Node | NodeType, b: Node | NodeType): boolean {
    const aType: NodeType = a instanceof Node ? a.type : a;
    const bType: NodeType = b instanceof Node ? b.type : b;
    return aType === bType;
}

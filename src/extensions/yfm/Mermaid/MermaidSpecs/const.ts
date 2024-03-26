import {nodeTypeFactory} from '../../../../utils/schema';

export enum MermaidAttrs {
    content = 'content',
    class = 'class',
    newCreated = 'newCreated',
}

export const mermaidNodeName = 'mermaid';
export const mermaidNodeType = nodeTypeFactory(mermaidNodeName);

export const MermaidAction = 'createMermaid';

export const MermaidConsts = {
    NodeName: mermaidNodeName,
    NodeAttrs: MermaidAttrs,
    nodeType: mermaidNodeType,
} as const;

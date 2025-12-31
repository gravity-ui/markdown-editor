import {entityIdAttr} from 'src/utils/entity-id';
import {nodeTypeFactory} from 'src/utils/schema';

export enum MermaidAttrs {
    // @ts-expect-error error TS18055
    EntityId = entityIdAttr,
    content = 'content',
    class = 'class',
    // MAJOR: remove before next major
    /** @deprecated This is no longer used. Removed in next major version */
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

export const defaultMermaidEntityId = mermaidNodeName + '#0';

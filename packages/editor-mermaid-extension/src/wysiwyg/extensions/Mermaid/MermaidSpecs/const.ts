import {entityIdAttr} from '@gravity-ui/markdown-editor/_/utils/entity-id.js';
import {nodeTypeFactory} from '@gravity-ui/markdown-editor/_/utils/schema.js';

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

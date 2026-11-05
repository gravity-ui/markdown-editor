import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const headerNodeName = 'header';
export const headerNodeType = (schema: Schema) => schema.nodes[headerNodeName];

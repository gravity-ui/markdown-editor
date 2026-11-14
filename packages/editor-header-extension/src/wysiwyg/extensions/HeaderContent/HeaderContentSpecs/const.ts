import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const headerContentNodeName = 'header_content';
export const headerContentNodeType = (schema: Schema) => schema.nodes[headerContentNodeName];

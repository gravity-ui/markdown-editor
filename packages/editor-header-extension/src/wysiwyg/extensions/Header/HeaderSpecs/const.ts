import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const headerNodeName = 'header';
export const headerTitleNodeName = 'header_title';
export const headerContentNodeName = 'header_content';
export const headerNodeType = (schema: Schema) => schema.nodes[headerNodeName];
export const headerTitleNodeType = (schema: Schema) => schema.nodes[headerTitleNodeName];
export const headerContentNodeType = (schema: Schema) => schema.nodes[headerContentNodeName];

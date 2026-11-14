import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const headerTitleNodeName = 'header_title';
export const headerTitleNodeType = (schema: Schema) => schema.nodes[headerTitleNodeName];

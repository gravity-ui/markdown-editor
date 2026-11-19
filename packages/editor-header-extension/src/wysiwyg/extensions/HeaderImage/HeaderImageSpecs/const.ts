import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const headerImageNodeName = 'header_image';
export const headerImageNodeType = (schema: Schema) => schema.nodes[headerImageNodeName];

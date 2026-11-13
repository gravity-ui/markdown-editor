import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const buttonNodeName = 'button';
export const buttonNodeType = (schema: Schema) => schema.nodes[buttonNodeName];

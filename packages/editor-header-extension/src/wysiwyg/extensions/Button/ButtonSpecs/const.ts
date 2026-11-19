import type {Schema} from '@gravity-ui/markdown-editor/pm/model';
import {ButtonAttr} from '@gravity-ui/markdown-plugin-header';

export const buttonNodeName = 'button';
export const buttonNodeType = (schema: Schema) => schema.nodes[buttonNodeName];

export const ButtonNodeAttr = {...ButtonAttr, Label: 'label'} as const;

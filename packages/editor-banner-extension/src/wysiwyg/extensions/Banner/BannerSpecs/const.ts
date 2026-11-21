import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const bannerNodeName = 'banner';
export const bannerNodeType = (schema: Schema) => schema.nodes[bannerNodeName];

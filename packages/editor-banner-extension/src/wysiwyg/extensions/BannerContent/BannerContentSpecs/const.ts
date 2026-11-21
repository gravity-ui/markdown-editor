import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const bannerContentNodeName = 'banner_content';
export const bannerContentNodeType = (schema: Schema) => schema.nodes[bannerContentNodeName];

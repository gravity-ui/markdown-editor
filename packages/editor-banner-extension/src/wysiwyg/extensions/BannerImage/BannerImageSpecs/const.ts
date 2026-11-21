import type {Schema} from '@gravity-ui/markdown-editor/pm/model';

export const bannerImageNodeName = 'banner_image';
export const bannerImageNodeType = (schema: Schema) => schema.nodes[bannerImageNodeName];

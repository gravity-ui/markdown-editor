import type {Schema} from '@gravity-ui/markdown-editor/pm/model';
import {bannerContentTokenName} from '@gravity-ui/markdown-plugin-banner';

export const bannerContentNodeName = bannerContentTokenName;
export const bannerContentNodeType = (schema: Schema) => schema.nodes[bannerContentNodeName];

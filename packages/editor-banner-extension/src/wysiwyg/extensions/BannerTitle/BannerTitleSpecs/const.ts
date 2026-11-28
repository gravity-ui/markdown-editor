import type {Schema} from '@gravity-ui/markdown-editor/pm/model';
import {bannerTitleTokenName} from '@gravity-ui/markdown-plugin-banner';

export const bannerTitleNodeName = bannerTitleTokenName;
export const bannerTitleNodeType = (schema: Schema) => schema.nodes[bannerTitleNodeName];

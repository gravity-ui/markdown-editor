import type {Schema} from '@gravity-ui/markdown-editor/pm/model';
import {bannerImageTokenName} from '@gravity-ui/markdown-plugin-banner';

export const bannerImageNodeName = bannerImageTokenName;
export const bannerImageNodeType = (schema: Schema) => schema.nodes[bannerImageNodeName];

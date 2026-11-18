import {nodeTypeFactory} from '@gravity-ui/markdown-editor/_/utils/schema.js';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';

export const quoteLinkNodeName = 'yfm_quote-link';
export const quoteLinkType = nodeTypeFactory(quoteLinkNodeName);
export const isQuoteLinkNode = (node: Node) => node.type.name === quoteLinkNodeName;

export enum QuoteLinkAttr {
    Cite = 'cite',
    DataContent = 'data-content',
}

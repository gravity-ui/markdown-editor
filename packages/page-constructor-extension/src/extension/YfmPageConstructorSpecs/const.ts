import {entityIdAttr, nodeTypeFactory} from '@gravity-ui/markdown-editor';

export const YfmPageConstructorAttrs = {
    EntityId: entityIdAttr,
    content: 'data-content',
} as const;

export const yfmPageConstructorNodeName = 'yfm-page-constructor';
export const yfmPageConstructorTokenName = 'yfm_page-constructor';
export const yfmPageConstructorNodeType = nodeTypeFactory(yfmPageConstructorNodeName);

export const YfmPageConstructorConsts = {
    NodeName: yfmPageConstructorNodeName,
    NodeAttrs: YfmPageConstructorAttrs,
    nodeType: yfmPageConstructorNodeType,
} as const;

export const defaultYfmPageConstructorEntityId = `${yfmPageConstructorNodeName}#0`;

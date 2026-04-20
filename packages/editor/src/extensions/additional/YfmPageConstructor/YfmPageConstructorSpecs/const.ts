import {entityIdAttr} from 'src/utils/entity-id';
import {nodeTypeFactory} from 'src/utils/schema';

export enum YfmPageConstructorAttrs {
    // @ts-expect-error error TS18055
    EntityId = entityIdAttr,
    content = 'data-content',
}

export const yfmPageConstructorNodeName = 'yfm-page-constructor';
export const yfmPageConstructorTokenName = 'yfm_page-constructor';
export const yfmPageConstructorNodeType = nodeTypeFactory(yfmPageConstructorNodeName);

export const YfmPageConstructorAction = 'createYfmPageConstructor';

export const YfmPageConstructorConsts = {
    NodeName: yfmPageConstructorNodeName,
    NodeAttrs: YfmPageConstructorAttrs,
    nodeType: yfmPageConstructorNodeType,
} as const;

export const defaultYfmPageConstructorEntityId = `${yfmPageConstructorNodeName}#0`;

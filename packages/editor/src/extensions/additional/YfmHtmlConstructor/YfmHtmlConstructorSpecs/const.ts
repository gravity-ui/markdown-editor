import {entityIdAttr} from 'src/utils/entity-id';
import {nodeTypeFactory} from 'src/utils/schema';

export enum YfmHtmlConstructorAttrs {
    // @ts-expect-error error TS18055
    EntityId = entityIdAttr,
    /** Active structure data. */
    structure = 'structure',
    /** Array of rendered HTML constructor blocks. */
    blocks = 'blocks',
}

export const yfmHtmlConstructorNodeName = 'yfm_html_constructor';
export const yfmHtmlConstructorNodeType = nodeTypeFactory(yfmHtmlConstructorNodeName);

export const YfmHtmlConstructorAction = 'createYfmHtmlConstructor';

export const YfmHtmlConstructorConsts = {
    NodeName: yfmHtmlConstructorNodeName,
    NodeAttrs: YfmHtmlConstructorAttrs,
    nodeType: yfmHtmlConstructorNodeType,
} as const;

export const defaultYfmHtmlConstructorEntityId = yfmHtmlConstructorNodeName + '#0';

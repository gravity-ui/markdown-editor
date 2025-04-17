import {entityIdAttr} from 'src/utils/entity-id';
import {nodeTypeFactory} from 'src/utils/schema';

export enum YfmHtmlBlockAttrs {
    // @ts-expect-error error TS18055
    EntityId = entityIdAttr,
    class = 'class',
    frameborder = 'frameborder',
    // MAJOR: remove before next major
    /** @deprecated This is no longer used. Removed in next major version */
    newCreated = 'newCreated',
    srcdoc = 'srcdoc',
    style = 'style',
}

export const yfmHtmlBlockNodeName = 'yfm_html_block';
export const yfmHtmlBlockNodeType = nodeTypeFactory(yfmHtmlBlockNodeName);

export const YfmHtmlBlockAction = 'createYfmHtmlBlock';

export const YfmHtmlBlockConsts = {
    NodeName: yfmHtmlBlockNodeName,
    NodeAttrs: YfmHtmlBlockAttrs,
    nodeType: yfmHtmlBlockNodeType,
} as const;

export const defaultYfmHtmlBlockEntityId = yfmHtmlBlockNodeName + '#0';

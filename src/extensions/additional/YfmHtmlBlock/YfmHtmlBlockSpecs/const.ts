import {nodeTypeFactory} from '../../../../utils/schema';

export enum YfmHtmlBlockAttrs {
    class = 'class',
    frameborder = 'frameborder',
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

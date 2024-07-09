import {nodeTypeFactory} from '../../../../utils/schema';

export enum YfmHtmlAttrs {
    class = 'class',
    frameborder = 'frameborder',
    newCreated = 'newCreated',
    srcdoc = 'srcdoc',
    style = 'style',
}

export const yfmHtmlNodeName = 'yfm_html_block';
export const yfmHtmlNodeType = nodeTypeFactory(yfmHtmlNodeName);

export const YfmHtmlAction = 'createYfmHtml';

export const YfmHtmlConsts = {
    NodeName: yfmHtmlNodeName,
    NodeAttrs: YfmHtmlAttrs,
    nodeType: yfmHtmlNodeType,
} as const;

import {nodeTypeFactory} from 'src/utils/schema';

export enum CutNode {
    Cut = 'yfm_cut',
    CutTitle = 'yfm_cut_title',
    CutContent = 'yfm_cut_content',
}

export enum CutAttr {
    Class = 'class',
    Markup = 'data-markup',
}

export const cutType = nodeTypeFactory(CutNode.Cut);
export const cutTitleType = nodeTypeFactory(CutNode.CutTitle);
export const cutContentType = nodeTypeFactory(CutNode.CutContent);

export const YfmCutClassName = {
    Cut: 'yfm-cut',
    Title: 'yfm-cut-title',
    Content: 'yfm-cut-content',
} as const;

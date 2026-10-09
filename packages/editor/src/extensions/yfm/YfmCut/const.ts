import {YfmCutClassName as YfmCutClassNameSpecs} from './YfmCutSpecs/const';

export {CutNode, CutAttr, cutType, cutTitleType, cutContentType} from './YfmCutSpecs/const';

export const YfmCutClassName = {
    ...YfmCutClassNameSpecs,
    TitleInner: 'g-md-yfm-cut-title-inner',
    Open: 'yfm-cut-open',
    Active: 'yfm-cut-active',
} as const;

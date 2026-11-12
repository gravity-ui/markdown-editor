import {markTypeFactory, nodeTypeFactory} from '../../../../utils/schema';

export const sampleAction = 'toSample';
export const sampleType = nodeTypeFactory('sample');
export const sampleMarkType = markTypeFactory('sample_mark');
export const sampleLineType = nodeTypeFactory('sample_line');
export const SampleConsts = {lineType: sampleLineType} as const;

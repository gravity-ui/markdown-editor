import {inlineWrapTo, wrapToBlock} from './helpers';

export const wrapToMathInline = inlineWrapTo('$');
export const wrapToMathBlock = wrapToBlock(
    ({lineBreak}) => '$$' + lineBreak,
    ({lineBreak}) => lineBreak + '$$',
);

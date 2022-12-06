import {nodeTypeFactory} from '../../../utils/schema';

export enum MathNode {
    Inline = 'math_inline',
    Block = 'math_display',
}

export const CLASSNAMES = {
    Inline: {
        Container: 'math-inline',
        Sharp: 'math-inline__sharp',
        Content: 'math-inline__content',
    },
} as const;

export const mathIType = nodeTypeFactory(MathNode.Inline);
export const mathBType = nodeTypeFactory(MathNode.Block);

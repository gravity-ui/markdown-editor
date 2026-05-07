import {
    MathNode,
    MathSpecs,
    mathBType,
    mathIType,
} from '@gravity-ui/markdown-editor/_/extensions/additional/Math/MathSpecs/index.js';

export const LatexSpecsExtension = MathSpecs;
export const LatexNodeName = {
    Block: MathNode.Block,
    Inline: MathNode.Inline,
} as const;
export const LatexNodeType = {
    Block: mathBType,
    Inline: mathIType,
};

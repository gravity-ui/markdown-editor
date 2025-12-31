import {type LineNumbersOptions, codeBlockType} from './CodeBlockSpecs';

export {codeBlockNodeName, CodeBlockNodeAttr as CodeBlockAttr} from './CodeBlockSpecs';
export const cbAction = 'toCodeBlock';
export {codeBlockType};

// After changing the default, don't forget to update LineNumbersOptions
export const lineNumbersOptionsDefault: LineNumbersOptions = {
    enabled: true,
    showByDefault: false,
};

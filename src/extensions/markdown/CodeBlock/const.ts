import {codeBlockType} from './CodeBlockSpecs';

export {
    codeBlockNodeName,
    codeBlockLangAttr,
    CodeBlockNodeAttr as CodeBlockAttr,
} from './CodeBlockSpecs';
export const cbAction = 'toCodeBlock';
/** @deprecated Use `codeBlockType` instead */
export const cbType = codeBlockType;
export {codeBlockType};

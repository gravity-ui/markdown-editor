import {TokenType as MdTokenType} from '@diplodoc/folding-headings-extension';

export {headingNodeName} from '@gravity-ui/markdown-editor/specs';

export const TokenType = MdTokenType as Pick<typeof MdTokenType, 'Section' | 'Heading' | 'Content'>;

export const FoldingHeadingAttr = {
    Folding: 'folded',
} as const;

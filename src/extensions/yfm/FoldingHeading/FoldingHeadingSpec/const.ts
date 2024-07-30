import {TokenType as MdTokenType} from '@diplodoc/folding-headings-extension';

export const TokenType = MdTokenType as Pick<typeof MdTokenType, 'Section' | 'Heading' | 'Content'>;

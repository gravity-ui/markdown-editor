import {inlineWrapTo, toggleInlineMarkupFactory} from './helpers';

export const colorify = (color: string) => inlineWrapTo(`{${color}}(`, ')');

export const toggleBold = toggleInlineMarkupFactory('**');
export const toggleItalic = toggleInlineMarkupFactory('_');
export const toggleStrikethrough = toggleInlineMarkupFactory('~~');
export const toggleUnderline = toggleInlineMarkupFactory('++');
export const toggleMonospace = toggleInlineMarkupFactory('##');
export const toggleMarked = toggleInlineMarkupFactory('==');

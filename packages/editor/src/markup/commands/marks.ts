import {toggleInlineMarkupFactory} from './helpers';

export const colorify = (color: string) =>
    toggleInlineMarkupFactory({before: `{${color}}(`, after: ')'});

export const toggleBold = toggleInlineMarkupFactory('**');
export const toggleItalic = toggleInlineMarkupFactory('_');
export const toggleStrikethrough = toggleInlineMarkupFactory('~~');
export const toggleUnderline = toggleInlineMarkupFactory('++');
export const toggleMonospace = toggleInlineMarkupFactory('##');
export const toggleMarked = toggleInlineMarkupFactory('==');

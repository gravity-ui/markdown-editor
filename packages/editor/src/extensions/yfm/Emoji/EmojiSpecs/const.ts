import {nodeTypeFactory} from '../../../../utils/schema';

export const emojiTokenName = 'emoji';
export const emojiNodeName = emojiTokenName;
export const emojiNodeType = nodeTypeFactory(emojiNodeName);
export const EmojiNodeAttrs = {
    Markup: 'markup',
} as const;

export const markupDataAttribute = 'data-emoji';

export const EmojiConsts = {
    NodeName: emojiNodeName,
    NodeAttrs: EmojiNodeAttrs,
    nodeType: emojiNodeType,
} as const;

import {PlaygroundMini} from '../../demo/components/PlaygroundMini';
import {markup} from '../../demo/stories/markdown/markup';

export const Heading = () => <PlaygroundMini initial={markup.heading} />;
export const Blockquotes = () => <PlaygroundMini initial={markup.blockquote} />;
export const Emphasis = () => <PlaygroundMini initial={markup.emphasis} />;
export const HorizontalRules = () => <PlaygroundMini initial={markup.horizontalRules} />;
export const Lists = () => <PlaygroundMini initial={markup.lists} />;
export const Code = () => <PlaygroundMini initial={markup.code} />;
export const Tables = () => <PlaygroundMini initial={markup.tables} />;
export const Links = () => <PlaygroundMini initial={markup.links} />;
export const Images = () => <PlaygroundMini initial={markup.images} />;
export const SubscriptSuperscript = () => <PlaygroundMini initial={markup.subAndSub} />;
export const Emojis = () => <PlaygroundMini initial={markup.emojis} />;
export const DefinitionList = () => <PlaygroundMini initial={markup.deflist} />;

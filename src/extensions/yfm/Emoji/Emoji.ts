import type {ExtensionAuto} from '../../../core';

import {EmojiInput} from './EmojiInput';
import {EmojiConsts, EmojiSpecs, EmojiSpecsOptions} from './EmojiSpecs';
import {EmojiSuggest} from './EmojiSuggest';

export {EmojiConsts} from './EmojiSpecs';

export type EmojiOptions = EmojiSpecsOptions & {};

const EmojiExtension: ExtensionAuto<EmojiOptions> = (builder, options) => {
    builder.use(EmojiSpecs, options);
    builder.use(EmojiInput, options);
    builder.use(EmojiSuggest, options);
};

export const Emoji = Object.assign(EmojiExtension, EmojiConsts);

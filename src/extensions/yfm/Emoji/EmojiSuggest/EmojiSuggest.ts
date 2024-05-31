import type {Action, ExtensionAuto} from '../../../../core';
import {Autocomplete, AutocompleteItem, openAutocomplete} from '../../../behavior/Autocomplete';
import type {EmojiSpecsOptions} from '../EmojiSpecs';

import {EmojiHandler} from './EmojiHandler';
import {DecoClassName} from './const';

const emojiSuggestActionName = 'openEmojiSuggest';
type EmojiSuggestActionAttrs = {text?: string};

export const EmojiSuggest: ExtensionAuto<EmojiSpecsOptions> = (builder, {defs, shortcuts}) => {
    if (!defs) return;

    if (!builder.context.has('autocomplete')) {
        builder.use(Autocomplete);
    }

    const item: AutocompleteItem = {
        trigger: {
            name: 'emoji',
            trigger: /(?:^|\s)(:)$/,
            allArrowKeys: false,
            cancelOnFirstSpace: true,
            decorationAttrs: {class: DecoClassName},
        },
        handler: new EmojiHandler({defs, shortcuts}),
    };

    builder.context.get('autocomplete')!.add(item);

    builder.addAction(emojiSuggestActionName, () => {
        return {
            isEnable: (state) => {
                return state.selection.empty;
            },
            run: (_s, _d, view, attrs?: EmojiSuggestActionAttrs) => {
                return openAutocomplete(view, ':', attrs?.text);
            },
        };
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [emojiSuggestActionName]: Action<EmojiSuggestActionAttrs>;
        }
    }
}

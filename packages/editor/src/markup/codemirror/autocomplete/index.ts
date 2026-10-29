import {mdAutocomplete} from '../yfm';

import {emojiAutocomplete} from './emoji';
import {emptyRowAutocomplete} from './emptyRow';

type GetAutocompleteConfig = {
    preserveEmptyRows?: boolean;
    emojiDefs?: Record<string, string>;
};

export const getAutocompleteConfig = ({preserveEmptyRows, emojiDefs}: GetAutocompleteConfig) => {
    const autocompleteItems = [];

    if (preserveEmptyRows) {
        autocompleteItems.push(emptyRowAutocomplete);
    }

    if (emojiDefs) {
        autocompleteItems.push(emojiAutocomplete(emojiDefs));
    }

    autocompleteItems.push(mdAutocomplete);

    return autocompleteItems;
};

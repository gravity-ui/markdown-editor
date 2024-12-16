import {mdAutocomplete} from '../yfm';

import {emptyRowAutocomplete} from './emptyRow';

type GetAutocompleteConfig = {
    preserveEmptyRows?: boolean;
};

export const getAutocompleteConfig = ({preserveEmptyRows}: GetAutocompleteConfig) => {
    const autocompleteItems = [];

    if (preserveEmptyRows) {
        autocompleteItems.push(emptyRowAutocomplete);
    }

    autocompleteItems.push(mdAutocomplete);

    return autocompleteItems;
};

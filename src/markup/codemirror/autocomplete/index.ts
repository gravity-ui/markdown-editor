import {directiveAutocomplete} from './directive';
import {emptyRowAutocomplete} from './emptyRow';

type GetAutocompleteConfig = {
    allowEmptyRows?: boolean;
};

export const getAutocompleteConfig = ({allowEmptyRows}: GetAutocompleteConfig) => {
    const autocompleteItems = [];

    if (allowEmptyRows) {
        autocompleteItems.push(emptyRowAutocomplete);
    }

    autocompleteItems.push(directiveAutocomplete);

    return autocompleteItems;
};

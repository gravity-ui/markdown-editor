import {AutocompleteDecoClassName} from '../../../behavior/Autocomplete';

import {DecoClassName} from './const';

export function findDecoElem(targetElem?: Element) {
    const target = targetElem ?? document;
    return (
        target.getElementsByClassName(DecoClassName).item(0) ??
        target.getElementsByClassName(AutocompleteDecoClassName).item(0)
    );
}

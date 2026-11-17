import {section} from '../markdown.mjs';
import {optionsList, parameterType} from '../type-members.mjs';

/** Renders the properties of the second parameter of the extension function. */
export function optionsSection({index, declaration}) {
    const {checker} = index;
    const type = declaration && checker.getTypeAtLocation(declaration.name);
    const options = parameterType(checker, type, 1, declaration);

    return section('### Options', optionsList(checker, options));
}

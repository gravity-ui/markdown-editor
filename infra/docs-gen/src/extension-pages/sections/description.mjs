import {jsDocLines} from '../jsdoc.mjs';
import {section} from '../markdown.mjs';

/** Renders the JSDoc of the extension constant. */
export function descriptionSection({declaration}) {
    return section('### Description', declaration ? jsDocLines(declaration) : []);
}

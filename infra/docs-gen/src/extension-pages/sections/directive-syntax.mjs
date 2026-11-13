import {NOT_FOUND, section} from '../markdown.mjs';
import {sortedUnique} from '../utils.mjs';

/** Renders a value as inline code or `Not found`. */
function code(value) {
    return value ? `\`${value}\`` : NOT_FOUND;
}

/** Renders the directive syntax keys declared in the extension files. */
export function directiveSyntaxSection({index, files}) {
    const keys = sortedUnique([...files].flatMap((file) => index.directiveKeys.get(file) ?? []));
    const body = keys.flatMap((key) => [
        `Key: ${code(key)}`,
        '',
        `Values: ${code(index.directiveSyntax.get('values'))}`,
        '',
        `Default: ${code(index.directiveSyntax.get('default'))}`,
        '',
    ]);

    return section('### Directive syntax', body.slice(0, -1));
}

import type MarkdownIt from 'markdown-it';

// `name="value"`, `name='value'`, `name=value`, `.class` or `#id`, as the directive parser reads them.
const ATTR_RE =
    /\s*(?:([a-z][a-z0-9\-_]*)\s*=\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)'|([a-z0-9\-_]+))|[.#][a-z0-9\-_]+)/giy;

/**
 * The value of a directive attribute as written in `{…}`: backslash escapes are resolved,
 * HTML entities are kept. The directive parser decodes entities, which changes an address
 * such as `/page?a=1&copy=2`.
 */
export function directiveRawAttr(
    md: MarkdownIt,
    attrsMarkup: string,
    name: string,
): string | undefined {
    const start = attrsMarkup.indexOf('{');
    if (start < 0) return undefined;
    ATTR_RE.lastIndex = start + 1;
    let match: RegExpExecArray | null;
    while ((match = ATTR_RE.exec(attrsMarkup))) {
        if (match[1] === name) {
            return md.utils.unescapeMd(match[2] ?? match[3] ?? match[4]);
        }
    }
    return undefined;
}

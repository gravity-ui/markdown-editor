import type MarkdownIt from 'markdown-it';

const ATTR_RE =
    /\s*(?:([a-z][a-z0-9\-_]*)\s*=\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)'|([a-z0-9\-_]+))|[.#][a-z0-9\-_]+)/giy;

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

/**
 * The directive parser decodes HTML entities in attribute values.
 * These values are read from the markup as written; a repeated attribute has no value.
 */
export function directiveRawAttrs<Name extends string>(
    md: MarkdownIt,
    attrsMarkup: string,
    attrs: Readonly<Record<string, unknown>>,
    names: readonly Name[],
): Record<Name, string | undefined> {
    return Object.fromEntries(
        names.map((name) => [
            name,
            typeof attrs[name] === 'string' ? directiveRawAttr(md, attrsMarkup, name) : undefined,
        ]),
    ) as Record<Name, string | undefined>;
}

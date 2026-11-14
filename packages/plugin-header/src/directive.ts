import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';

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

/**
 * The values of directive attributes as written (see `directiveRawAttr`), by name. A value is
 * read only when the directive parser found a single one: a repeated attribute is a list of
 * values and counts as unsupported.
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

/** The line of a block directive that holds its attributes: `:::header{…}`. */
export function blockDirectiveLine(state: StateBlock, line: number): string {
    return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

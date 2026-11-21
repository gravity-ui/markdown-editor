import type {LeafBlockDirectiveParams} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';

const ATTR_RE =
    /\s*(?:([a-z][a-z0-9\-_]*)\s*=\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)'|([a-z0-9\-_]+))|[.#][a-z0-9\-_]+)/giy;

export function directiveRawAttrs<Name extends string>(
    md: MarkdownIt,
    attrsMarkup: string,
    attrs: Readonly<Record<string, unknown>>,
    names: readonly Name[],
): Record<Name, string | undefined> {
    const result = Object.fromEntries(names.map((name) => [name, undefined])) as Record<
        Name,
        string | undefined
    >;
    const wanted = names.filter((name) => typeof attrs[name] === 'string');
    const start = attrsMarkup.indexOf('{');
    if (start < 0 || !wanted.length) return result;
    ATTR_RE.lastIndex = start + 1;
    let match: RegExpExecArray | null;
    while ((match = ATTR_RE.exec(attrsMarkup))) {
        const name = match[1] as Name;
        if (wanted.includes(name) && result[name] === undefined) {
            result[name] = md.utils.unescapeMd(match[2] ?? match[3] ?? match[4]);
        }
    }
    return result;
}

export function blockDirectiveRawAttrs<Name extends string>(
    state: StateBlock,
    {startLine: line, attrs = {}}: LeafBlockDirectiveParams,
    names: readonly Name[],
): Record<Name, string | undefined> {
    const markup = state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
    return directiveRawAttrs(state.md, markup, attrs, names);
}

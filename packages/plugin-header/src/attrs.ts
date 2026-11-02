import type {LeafBlockDirectiveParams} from '@diplodoc/directive';

export type DirectiveAttrsSchema = Record<string, (value: string) => boolean>;

export type DirectiveAttrs<S extends DirectiveAttrsSchema> = {
    [K in keyof S]?: S[K] extends ((value: string) => value is infer T extends string) ? T : string;
};

/** Returns `undefined` if the opening line has anything besides attributes from the schema. */
export function parseDirectiveAttrs<S extends DirectiveAttrsSchema>(
    params: LeafBlockDirectiveParams,
    schema: S,
): DirectiveAttrs<S> | undefined {
    if (params.contentTitle || params.inlineContent || params.dests) return undefined;
    const attrs: Record<string, string> = {};
    for (const [name, value] of Object.entries(params.attrs ?? {})) {
        // A repeated attribute comes as an array of values.
        if (typeof value !== 'string') return undefined;
        if (!Object.prototype.hasOwnProperty.call(schema, name) || !schema[name](value))
            return undefined;
        attrs[name] = value;
    }
    return attrs as DirectiveAttrs<S>;
}

export function stringifyAttrs(
    attrs: Record<string, string | undefined>,
    defaults: Record<string, string | undefined> = {},
) {
    const entries = Object.entries(attrs).filter(
        ([name, value]) => value !== undefined && value !== defaults[name],
    );
    if (!entries.length) return '';
    const list = entries.map(
        ([name, value = '']) => `${name}="${value.replace(/["\\]/g, '\\$&')}"`,
    );
    return `{${list.join(' ')}}`;
}

import type {AttributeSpec, Schema} from 'prosemirror-model';

export function validateMatrixJSON(value: unknown, schema: Schema): boolean {
    if (
        !isRecord(value) ||
        typeof value.type !== 'string' ||
        !Object.hasOwn(schema.nodes, value.type)
    )
        return false;
    const type = schema.nodes[value.type];
    if (
        type.isText
            ? typeof value.text !== 'string' || value.content !== undefined
            : value.text !== undefined
    )
        return false;
    if (!validAttrs(value.attrs, type.spec.attrs)) return false;
    if (value.marks !== undefined) {
        if (!Array.isArray(value.marks)) return false;
        for (const mark of value.marks) {
            if (
                !isRecord(mark) ||
                typeof mark.type !== 'string' ||
                !Object.hasOwn(schema.marks, mark.type)
            )
                return false;
            if (!validAttrs(mark.attrs, schema.marks[mark.type].spec.attrs)) return false;
        }
    }
    return (
        value.content === undefined ||
        (Array.isArray(value.content) &&
            value.content.every((child) => validateMatrixJSON(child, schema)))
    );
}

function validAttrs(value: unknown, specs: {[name: string]: AttributeSpec} | undefined): boolean {
    return (
        value === undefined ||
        (isRecord(value) &&
            Object.entries(value).every(
                ([name, attr]) =>
                    (specs && Object.hasOwn(specs, name)) ||
                    attr === null ||
                    attr === undefined ||
                    attr === false ||
                    attr === '',
            ))
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

import type {Schema} from 'prosemirror-model';

const validatedSchemas = new WeakSet<Schema>();

export function validateResourceSchema(schema: Schema): void {
    if (validatedSchemas.has(schema)) return;
    for (const type of Object.values(schema.nodes)) {
        const resource = type.spec._resource;
        if (
            resource !== undefined &&
            (!resource ||
                typeof resource.kind !== 'string' ||
                !resource.kind ||
                typeof resource.valueAttribute !== 'string' ||
                !resource.valueAttribute ||
                !Object.prototype.hasOwnProperty.call(
                    type.spec.attrs ?? {},
                    resource.valueAttribute,
                ))
        ) {
            throw new Error(`Invalid resource description: ${type.name}`);
        }
    }
    validatedSchemas.add(schema);
}

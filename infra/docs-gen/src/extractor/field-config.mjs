import {extractNameField} from './fields/name.mjs';

export const EXTENSION_FIELD_CONFIG = {
    name: {
        from: 'extension source files: exported Extension/ExtensionAuto/ExtensionWithOptions const',
        required: true,
        extract: extractNameField,
    },
};

export function createExtensionRecord(context, fieldConfig = EXTENSION_FIELD_CONFIG) {
    const record = {};

    for (const [fieldName, config] of Object.entries(fieldConfig)) {
        const value = config.extract(context);
        if (config.required && value === null) return null;

        record[fieldName] = value;
    }

    return record;
}

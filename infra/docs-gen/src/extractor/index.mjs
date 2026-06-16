import {EXTENSION_ENTRY_POINTS} from './config.mjs';
import {collectExtensionRefs, filterExtensionRefs} from './entry-points.mjs';
import {createExtensionRecord, EXTENSION_FIELD_CONFIG} from './field-config.mjs';
import {readSourceFiles} from './source-files.mjs';

function scanExtension(extensionRef, fieldConfig) {
    return createExtensionRecord(
        {
            extensionRef,
            sourceFiles: readSourceFiles(extensionRef.sourceDir),
        },
        fieldConfig,
    );
}

export function extractExtensionData({
    entryPoints = EXTENSION_ENTRY_POINTS,
    fieldConfig = EXTENSION_FIELD_CONFIG,
} = {}) {
    return filterExtensionRefs(collectExtensionRefs(entryPoints))
        .map((extensionRef) => scanExtension(extensionRef, fieldConfig))
        .filter(Boolean);
}

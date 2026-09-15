import {extractExtensionNamesFromSource} from '../ast/extension-name.mjs';
import {unique} from '../ast/core.mjs';

export function extractNameField({extensionRef, sourceFiles}) {
    const names = unique(
        sourceFiles.flatMap((sourceFile) =>
            extractExtensionNamesFromSource(sourceFile.content, sourceFile.path),
        ),
    );

    return names.includes(extensionRef.name) ? extensionRef.name : null;
}

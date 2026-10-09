import type {ExtensionAuto} from '#core';

import {headerDirective} from './md/header';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export * from './const';
export * from './attrs';
export * from './content';
export {getSchemaSpecs};

/** Schema and Markdown support without the editing UI. */
export const HeaderSpecs: ExtensionAuto = (builder) => {
    const schemaSpecs = getSchemaSpecs(builder.context.get('placeholder'));

    builder.configureMd((md) => md.use(headerDirective));

    for (const [name, spec] of Object.entries(schemaSpecs)) {
        builder
            .addNodeSpec(name, () => spec)
            .addMarkdownTokenParserSpec(name, () => parserTokens[name as keyof typeof parserTokens])
            .addNodeSerializerSpec(
                name,
                () => serializerTokens[name as keyof typeof serializerTokens],
            );
    }
};

import type {ExtensionAuto} from '#core';

import {headerDirective} from './md/header';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export * from './const';
export * from './attrs';
export * from './content';
export {getSchemaSpecs};

/**
 * Схема, парсер и сериализатор `:::header-block` без React, DOM и Gravity UI: этот слой поднимается
 * в SSR, в markup-режиме и в round-trip тестах. Всё видимое живёт в `Header`.
 */
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

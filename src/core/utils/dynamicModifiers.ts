import {SchemaDynamicModifierConfig} from '../SchemaDynamicModifier';
import {MarkdownParserDynamicModifierConfig} from '../markdown/MarkdownParser';
import {MarkdownSerializerDynamicModifierConfig} from '../markdown/MarkdownSerializerDynamicModifier';
import {DynamicModifiers} from '../types/dynamicModifiers';

export function convertDynamicModifiersConfigs(modifiers: DynamicModifiers[]): {
    parser: MarkdownParserDynamicModifierConfig;
    schema: SchemaDynamicModifierConfig;
    serializer: MarkdownSerializerDynamicModifierConfig;
} {
    const parser: MarkdownParserDynamicModifierConfig = {};
    const schema: SchemaDynamicModifierConfig = {};
    const serializer: MarkdownSerializerDynamicModifierConfig = {};

    modifiers.forEach((modifier) => {
        switch (modifier.type) {
            case 'parserToken': {
                const {tokenName, process} = modifier;
                parser[tokenName] = parser[tokenName] || {};
                parser[tokenName].processToken = parser[tokenName].processToken || [];
                parser[tokenName].processToken?.push(process);
                break;
            }
            case 'parserNodeAttrs': {
                const {tokenName, process} = modifier;
                parser[tokenName] = parser[tokenName] || {};
                parser[tokenName].processNodeAttrs = parser[tokenName].processNodeAttrs || [];
                parser[tokenName].processNodeAttrs?.push(process);
                break;
            }
            case 'parserNode': {
                const {nodeName, process} = modifier;
                parser[nodeName] = parser[nodeName] || {};
                parser[nodeName].processNode = parser[nodeName].processNode || [];
                parser[nodeName].processNode?.push(process);
                break;
            }
            case 'serializerNode': {
                const {nodeName, process} = modifier;
                serializer[nodeName] = serializer[nodeName] || {};
                serializer[nodeName].processNode = serializer[nodeName].processNode || [];
                serializer[nodeName].processNode?.push(process);
                break;
            }
            case 'schemaNodeSpec': {
                const {nodeName, allowedAttrs} = modifier;
                schema[nodeName] = {allowedAttrs};
                break;
            }
        }
    });

    return {parser, schema, serializer};
}

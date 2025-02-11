import {
    DynamicModifiers,
    ParserNodeAttrsModifier,
    ParserTokenModifier,
    SchemaNodeSpecModifier,
    SerializerNodeModifier,
} from '../types/dynamicModifiers';

import {convertDynamicModifiersConfigs} from './dynamicModifiers';

describe('convertDynamicModifiersConfigs', () => {
    test('should create parserToken config correctly', () => {
        const modifiers: ParserTokenModifier[] = [
            {
                type: 'parserToken',
                tokenName: 'bold',
                process: jest.fn(),
            },
        ];

        const result = convertDynamicModifiersConfigs(modifiers as DynamicModifiers[]);

        expect(result.parser['bold']).toBeDefined();
        expect(result.parser['bold'].processToken).toHaveLength(1);
        expect(result.parser['bold'].processToken?.[0]).toBe(modifiers[0].process);
    });

    test('should create parserNodeAttrs config correctly', () => {
        const modifiers: ParserNodeAttrsModifier[] = [
            {
                type: 'parserNodeAttrs',
                tokenName: 'link',
                process: jest.fn(),
            },
        ];

        const result = convertDynamicModifiersConfigs(modifiers);

        expect(result.parser['link']).toBeDefined();
        expect(result.parser['link'].processNodeAttrs).toHaveLength(1);
        expect(result.parser['link'].processNodeAttrs?.[0]).toBe(modifiers[0].process);
    });

    test('should create serializerNode config correctly', () => {
        const modifiers: SerializerNodeModifier[] = [
            {
                type: 'serializerNode',
                nodeName: 'paragraph',
                process: jest.fn(),
            },
        ];

        const result = convertDynamicModifiersConfigs(modifiers);

        expect(result.serializer['paragraph']).toBeDefined();
        expect(result.serializer['paragraph'].processNode).toHaveLength(1);
        expect(result.serializer['paragraph'].processNode?.[0]).toBe(modifiers[0].process);
    });

    test('should create schemaNodeSpec config correctly', () => {
        const modifiers: SchemaNodeSpecModifier[] = [
            {
                type: 'schemaNodeSpec',
                nodeName: 'image',
                allowedAttrs: ['src', 'alt'],
            },
        ];

        const result = convertDynamicModifiersConfigs(modifiers);

        expect(result.schema['image']).toBeDefined();
        expect(result.schema['image'].allowedAttrs).toEqual(['src', 'alt']);
    });

    test('should combine multiple modifiers correctly', () => {
        const modifiers: DynamicModifiers[] = [
            {
                type: 'parserToken',
                tokenName: 'bold',
                process: jest.fn(),
            },
            {
                type: 'parserNodeAttrs',
                tokenName: 'link',
                process: jest.fn(),
            },
            {
                type: 'serializerNode',
                nodeName: 'paragraph',
                process: jest.fn(),
            },
            {
                type: 'schemaNodeSpec',
                nodeName: 'image',
                allowedAttrs: ['src', 'alt'],
            },
        ];

        const result = convertDynamicModifiersConfigs(modifiers);

        expect(result.parser['bold'].processToken).toHaveLength(1);
        expect(result.parser['link'].processNodeAttrs).toHaveLength(1);
        expect(result.serializer['paragraph'].processNode).toHaveLength(1);
        expect(result.schema['image'].allowedAttrs).toEqual(['src', 'alt']);
    });
});

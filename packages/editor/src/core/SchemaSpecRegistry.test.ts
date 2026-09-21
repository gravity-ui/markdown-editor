import {describe, expect, it} from 'vitest';

import {SchemaSpecRegistry} from './SchemaSpecRegistry';

describe('SchemaSpecRegistry', () => {
    it('checks node and mark registrations before creating a schema', () => {
        const registry = new SchemaSpecRegistry();
        registry.addNode('paragraph', {content: 'inline*'});
        registry.addMark('emphasis', {});

        expect(registry.hasNode('paragraph')).toBe(true);
        expect(registry.hasMark('paragraph')).toBe(false);
        expect(registry.hasMark('emphasis')).toBe(true);
        expect(registry.hasNode('emphasis')).toBe(false);
    });

    it('does not treat inherited object properties as registrations', () => {
        const registry = new SchemaSpecRegistry();

        expect(registry.hasNode('toString')).toBe(false);
        expect(registry.hasMark('constructor')).toBe(false);
    });

    it.each([undefined, 'document', ''])(
        'uses the same root name as ProseMirror for %s',
        (topNode) => {
            const registry = new SchemaSpecRegistry(topNode);
            const expectedName = topNode || 'doc';
            registry.addNode(expectedName, {content: 'text*'});
            registry.addNode('text', {});

            expect(registry.topNodeName).toBe(expectedName);
            expect(registry.createSchema().topNodeType.name).toBe(registry.topNodeName);
        },
    );
});

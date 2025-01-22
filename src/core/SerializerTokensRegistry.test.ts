import {SerializerTokensRegistry} from './SerializerTokensRegistry';
import {MarkupManager} from './markdown/MarkupManager';
import type {SerializerTests} from './types/serializer';

describe('SerializerTokensRegistry', () => {
    it('should create empty serializer', () => {
        const markupManager = new MarkupManager();
        const serializer = new SerializerTokensRegistry().createSerializer(markupManager);
        expect(typeof serializer.serialize).toBe('function');
    });

    it('should add nodes', () => {
        const nodeName = 'example_node';
        const markupManager = new MarkupManager();

        const serializer = new SerializerTokensRegistry()
            .addNode(nodeName, () => {})
            .createSerializer(markupManager) as SerializerTests;

        expect(serializer.containsNode(nodeName)).toBe(true);
    });

    it('should add marks', () => {
        const markName = 'example_mark';
        const markupManager = new MarkupManager();

        const serializer = new SerializerTokensRegistry()
            .addMark(markName, {open: '1', close: '2'})
            .createSerializer(markupManager) as SerializerTests;

        expect(serializer.containsMark(markName)).toBe(true);
    });
});

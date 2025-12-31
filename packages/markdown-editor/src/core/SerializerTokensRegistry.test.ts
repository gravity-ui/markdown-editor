import {SerializerTokensRegistry} from './SerializerTokensRegistry';

describe('SerializerTokensRegistry', () => {
    it('should create empty serializer', () => {
        const serializer = new SerializerTokensRegistry().createSerializer();
        expect(typeof serializer.serialize).toBe('function');
    });

    it('should add nodes', () => {
        const nodeName = 'example_node';

        const serializer = new SerializerTokensRegistry()
            .addNode(nodeName, () => {})
            .createSerializer();

        expect(serializer.containsNode(nodeName)).toBe(true);
    });

    it('should add marks', () => {
        const markName = 'example_mark';

        const serializer = new SerializerTokensRegistry()
            .addMark(markName, {open: '1', close: '2'})
            .createSerializer();

        expect(serializer.containsMark(markName)).toBe(true);
    });
});

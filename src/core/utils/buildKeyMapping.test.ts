import {buildKeyMapping} from './buildKeyMapping';

describe('buildKeyMapping', () => {
    it('should return empty maps when config is empty', () => {
        const {processorsMap, keyMapping} = buildKeyMapping({});

        expect(processorsMap.size).toBe(0);
        expect(keyMapping.size).toBe(0);
    });

    it('should handle only simple (single) keys', () => {
        const config = {
            paragraph: {data: 'p'},
            heading: {data: 'h'},
        };
        const {processorsMap, keyMapping} = buildKeyMapping(config);

        // Each key is simply itself
        expect(processorsMap.size).toBe(2);
        expect(processorsMap.get('paragraph')).toEqual({data: 'p'});
        expect(processorsMap.get('heading')).toEqual({data: 'h'});

        // keyMapping should reflect that each key only maps to itself
        expect(keyMapping.size).toBe(2);
        expect(keyMapping.get('paragraph')).toEqual(['paragraph']);
        expect(keyMapping.get('heading')).toEqual(['heading']);
    });

    it('should handle only complex (comma-separated) keys', () => {
        const config = {
            'paragraph,heading': {data: 'p+h'},
            'listItem,blockquote': {data: 'li+blk'},
        };
        const {processorsMap, keyMapping} = buildKeyMapping(config);

        // Two complex keys
        expect(processorsMap.size).toBe(2);
        expect(processorsMap.get('paragraph,heading')).toEqual({data: 'p+h'});
        expect(processorsMap.get('listItem,blockquote')).toEqual({data: 'li+blk'});

        // keyMapping: each "simple" part maps to the combined key
        expect(keyMapping.get('paragraph')).toEqual(['paragraph,heading']);
        expect(keyMapping.get('heading')).toEqual(['paragraph,heading']);
        expect(keyMapping.get('listItem')).toEqual(['listItem,blockquote']);
        expect(keyMapping.get('blockquote')).toEqual(['listItem,blockquote']);
    });

    it('should handle a mix of simple and complex keys, with a single simple key also present separately', () => {
        const config = {
            'paragraph,heading': {data: 'p+h'},
            paragraph: {data: 'p'},
        };
        const {processorsMap, keyMapping} = buildKeyMapping(config);

        // We have one complex key and one simple key
        expect(processorsMap.size).toBe(2);
        expect(processorsMap.get('paragraph,heading')).toEqual({data: 'p+h'});
        expect(processorsMap.get('paragraph')).toEqual({data: 'p'});

        // The "paragraph" key appears in both a complex and a simple entry
        // so in keyMapping we expect an array with both
        expect(keyMapping.get('paragraph')).toEqual(['paragraph,heading', 'paragraph']);
        expect(keyMapping.get('heading')).toEqual(['paragraph,heading']);
    });

    it('should handle two distinct complex keys and one simple key, verifying the order they appear in the mapping array', () => {
        const config = {
            'paragraph,heading': {data: 'p+h'},
            'paragraph,listItem': {data: 'p+li'},
            paragraph: {data: 'p'},
        };
        const {processorsMap, keyMapping} = buildKeyMapping(config);

        // We have three entries: two complex and one simple
        expect(processorsMap.size).toBe(3);

        // "paragraph" belongs to two complex keys plus its own simple key
        // The array order depends on insertion order in the original config
        expect(keyMapping.get('paragraph')).toEqual([
            'paragraph,heading',
            'paragraph,listItem',
            'paragraph',
        ]);

        // "heading" belongs only to paragraph,heading
        expect(keyMapping.get('heading')).toEqual(['paragraph,heading']);

        // "listItem" belongs only to paragraph,listItem
        expect(keyMapping.get('listItem')).toEqual(['paragraph,listItem']);
    });

    it('should handle a case where a comma-separated key contains repeated items', () => {
        // Even though it's somewhat unusual, let's see how it behaves
        const config = {
            'paragraph,paragraph': {data: 'p+p'},
        };
        const {processorsMap, keyMapping} = buildKeyMapping(config);

        // Only one complex key effectively
        expect(processorsMap.size).toBe(1);
        expect(processorsMap.get('paragraph,paragraph')).toEqual({data: 'p+p'});

        // keyMapping for "paragraph" will have ["paragraph,paragraph"]
        // It's repeated but there's only that one complex key
        expect(keyMapping.get('paragraph')).toEqual(['paragraph,paragraph']);
    });
});

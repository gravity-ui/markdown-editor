import {parseMarkers} from '../utils';

describe('parseMarkers', () => {
    it('should parse list markers correctly', () => {
        expect(parseMarkers('* list')).toEqual(['* ']);
        expect(parseMarkers('- list')).toEqual(['- ']);
        expect(parseMarkers('+ list')).toEqual(['+ ']);
        expect(parseMarkers('  * list')).toEqual([' ', ' ', '* ']);
        expect(parseMarkers('    * list')).toEqual(['    ', '* ']);
    });

    it('should parse blockquote markers correctly', () => {
        expect(parseMarkers('> quote')).toEqual(['> ']);
        expect(parseMarkers('  > quote')).toEqual([' ', ' ', '> ']);
    });

    it('should parse indentation correctly', () => {
        expect(parseMarkers('  text')).toEqual([' ', ' ']);
        expect(parseMarkers('    text')).toEqual(['    ']);
    });

    it('should handle empty or invalid input', () => {
        expect(parseMarkers('')).toEqual([]);
        expect(parseMarkers('text')).toEqual([]);
        expect(parseMarkers(' text')).toEqual([' ']);
    });
});

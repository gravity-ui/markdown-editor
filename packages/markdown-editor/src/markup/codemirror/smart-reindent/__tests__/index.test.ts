import {smartReindent} from '../index';

describe('smartReindent', () => {
    // Basic functionality
    it('should preserve pasted text when current line is empty', () => {
        const pastedText = 'First line\nSecond line';
        const currentLine = '';

        expect(smartReindent(pastedText, currentLine)).toBe(pastedText);
    });

    it('should preserve pasted text when current line has no markers', () => {
        const pastedText = 'First line\nSecond line';
        const currentLine = 'Just plain text';

        expect(smartReindent(pastedText, currentLine)).toBe(pastedText);
    });

    // List markers
    it('should reindent with numeric list markers', () => {
        const pastedText = 'First item\nSecond item\nThird item';
        const currentLine = '1. List item';

        expect(smartReindent(pastedText, currentLine)).toBe(
            'First item\n   Second item\n   Third item',
        );
    });

    it('should reindent with dash list markers', () => {
        const pastedText = 'First item\nSecond item';
        const currentLine = '- List item';

        expect(smartReindent(pastedText, currentLine)).toBe('First item\n  Second item');
    });

    it('should reindent with asterisk list markers', () => {
        const pastedText = 'First item\nSecond item';
        const currentLine = '* List item';

        expect(smartReindent(pastedText, currentLine)).toBe('First item\n  Second item');
    });

    it('should reindent with plus list markers', () => {
        const pastedText = 'First item\nSecond item';
        const currentLine = '+ List item';

        expect(smartReindent(pastedText, currentLine)).toBe('First item\n  Second item');
    });

    // Edge cases
    it('should handle multi-digit numeric markers correctly', () => {
        const pastedText = 'First item\nSecond item';
        const currentLine = '123. List item';

        expect(smartReindent(pastedText, currentLine)).toBe('First item\n     Second item');
    });

    it('should preserve empty lines with indentation', () => {
        const pastedText = 'First item\n\nThird item';
        const currentLine = '- List item';

        expect(smartReindent(pastedText, currentLine)).toBe('First item\n  \n  Third item');
    });

    it('should handle multiple markers correctly', () => {
        const pastedText = 'First item\nSecond item';
        const currentLine = '  - Nested list item';

        expect(smartReindent(pastedText, currentLine)).toBe('First item\n    Second item');
    });

    it('should handle single-line paste correctly', () => {
        const pastedText = 'Single line';
        const currentLine = '- List item';

        expect(smartReindent(pastedText, currentLine)).toBe('Single line');
    });

    it('should handle windows-style line endings', () => {
        const pastedText = 'First item\r\nSecond item';
        const currentLine = '- List item';

        expect(smartReindent(pastedText, currentLine)).toBe('First item\r\n  Second item');
    });

    // Block quotes
    it('should reindent with blockquote markers', () => {
        const pastedText = 'First quote\nSecond quote';
        const currentLine = '> Quoted text';

        expect(smartReindent(pastedText, currentLine)).toBe('First quote\n> Second quote');
    });

    it('should handle nested blockquotes', () => {
        const pastedText = 'First quote\nSecond quote';
        const currentLine = '> > Nested quote';

        expect(smartReindent(pastedText, currentLine)).toBe('First quote\n> > Second quote');
    });

    // Spaces and indentation
    it('should handle double space indentation', () => {
        const pastedText = 'First line\nSecond line';
        const currentLine = '  Indented text';

        expect(smartReindent(pastedText, currentLine)).toBe('First line\n  Second line');
    });

    it('should handle code block indentation (4 spaces)', () => {
        const pastedText = 'var x = 1;\nvar y = 2;';
        const currentLine = '    Code block';

        expect(smartReindent(pastedText, currentLine)).toBe('var x = 1;\n    var y = 2;');
    });

    it('should handle mixed markers correctly', () => {
        const pastedText = 'First line\nSecond line';
        const currentLine = '  > - Nested quote with list';

        expect(smartReindent(pastedText, currentLine)).toBe('First line\n  >   Second line');
    });
});

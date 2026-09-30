import {parseTemplates} from './parse';

describe('parseTemplates', () => {
    it('parses a single template with id and title', () => {
        const result = parseTemplates(
            '<template id="hero" title="Hero block"><div>Hello</div></template>',
        );

        expect(result).toEqual([{id: 'hero', title: 'Hero block', content: '<div>Hello</div>'}]);
    });

    it('parses multiple templates at once', () => {
        const result = parseTemplates(`
            <template id="a" title="First"><p>1</p></template>
            <template id="b" title="Second"><p>2</p></template>
        `);

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({id: 'a', title: 'First', content: '<p>1</p>'});
        expect(result[1]).toMatchObject({id: 'b', title: 'Second', content: '<p>2</p>'});
    });

    it('falls back title to id when title is missing', () => {
        const [template] = parseTemplates('<template id="only-id"><span>x</span></template>');

        expect(template.id).toBe('only-id');
        expect(template.title).toBe('only-id');
    });

    it('generates an id when it is missing', () => {
        const [template] = parseTemplates('<template title="No id"><span>x</span></template>');

        expect(template.id).toBeTruthy();
        expect(template.title).toBe('No id');
    });

    it('treats input without template tags as a single template', () => {
        const result = parseTemplates('<div class="card">card</div>');

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('<div class="card">card</div>');
        expect(result[0].id).toBeTruthy();
    });

    it('returns an empty array for blank input', () => {
        expect(parseTemplates('   ')).toEqual([]);
        expect(parseTemplates('')).toEqual([]);
    });
});

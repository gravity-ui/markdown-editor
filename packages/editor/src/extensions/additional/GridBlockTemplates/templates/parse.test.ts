import {parseTemplateBlock, parseTemplates} from './parse';

describe('parseTemplateBlock', () => {
    it('normalizes raw html with a styled root element', () => {
        expect(parseTemplateBlock('<div style="padding:12px"><strong>Text</strong></div>')).toEqual(
            {
                css: 'padding:12px',
                content: '<strong>Text</strong>',
            },
        );
    });

    it('uses the raw value when input has no root element', () => {
        expect(parseTemplateBlock('Plain text')).toEqual({
            css: '',
            content: 'Plain text',
        });
    });
});

describe('parseTemplates', () => {
    it('parses multiple typed templates at once', () => {
        const result = parseTemplates(`
            <template id="layout" title="Layout" type="container">
                <div class="grid" style="display:grid;grid-template-columns:1fr 1fr">
                    <div style="padding:8px"><strong>Left</strong></div>
                    <div style="padding:10px">Right</div>
                </div>
            </template>
            <template id="card" title="Card" type="block">
                <div style="padding:12px">Card text</div>
            </template>
        `);

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            id: 'layout',
            title: 'Layout',
            type: 'container',
            containerCss: 'display:grid;grid-template-columns:1fr 1fr',
            blocks: [
                {css: 'padding:8px', content: '<strong>Left</strong>'},
                {css: 'padding:10px', content: 'Right'},
            ],
        });
        expect(result[1]).toMatchObject({
            id: 'card',
            title: 'Card',
            type: 'block',
            block: {css: 'padding:12px', content: 'Card text'},
        });
    });

    it('parses a container template from serialized grid html', () => {
        const [template] = parseTemplates(`
            <template id="grid" title="Grid" type="container">
                <div class="grid" style="display:grid;gap:12px">
                    <div class="block-1" style="padding:12px">First</div>
                    <div class="block-2" style="padding:14px"><em>Second</em></div>
                </div>
            </template>
        `);

        expect(template).toMatchObject({
            type: 'container',
            containerCss: 'display:grid;gap:12px',
            blocks: [
                {css: 'padding:12px', content: 'First'},
                {css: 'padding:14px', content: '<em>Second</em>'},
            ],
        });
    });

    it('falls back to raw content for a plain block template', () => {
        const [template] = parseTemplates(
            '<template id="plain" title="Plain" type="block">Plain text</template>',
        );

        expect(template).toMatchObject({
            id: 'plain',
            title: 'Plain',
            type: 'block',
            block: {css: '', content: 'Plain text'},
        });
    });

    it('ignores templates without a valid type', () => {
        expect(
            parseTemplates(`
                <template id="missing"><div>Missing type</div></template>
                <template id="unknown" type="section"><div>Unknown type</div></template>
            `),
        ).toEqual([]);
    });

    it('returns an empty array for blank input', () => {
        expect(parseTemplates('   ')).toEqual([]);
        expect(parseTemplates('')).toEqual([]);
    });
});

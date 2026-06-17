import {parseRawBlock, parseTemplateBlock, parseTemplates} from './parse';

describe('parseRawBlock', () => {
    it('keeps the root element verbatim instead of unwrapping it', () => {
        expect(parseRawBlock('<div>какой-то текст</div>')).toEqual({
            css: '',
            content: '<div>какой-то текст</div>',
        });
    });

    it('trims and keeps plain text', () => {
        expect(parseRawBlock('  Plain text  ')).toEqual({
            css: '',
            content: 'Plain text',
        });
    });
});

describe('parseTemplateBlock', () => {
    it('keeps inline style attributes in html instead of extracting them into css', () => {
        expect(parseTemplateBlock('<div style="padding:12px"><strong>Text</strong></div>')).toEqual(
            {
                css: '',
                content: '<div style="padding:12px"><strong>Text</strong></div>',
            },
        );
    });

    it('uses the raw value when input has no root element', () => {
        expect(parseTemplateBlock('Plain text')).toEqual({
            css: '',
            content: 'Plain text',
        });
    });

    it('extracts all style tags into css and keeps the remaining html', () => {
        expect(
            parseTemplateBlock(
                '<h1>Title</h1><style>& { padding: 12px; }</style><div><strong>Text</strong></div><style>strong { color: red; }</style>',
            ),
        ).toEqual({
            css: '& { padding: 12px; }\n\nstrong { color: red; }',
            content: '<h1>Title</h1><div><strong>Text</strong></div>',
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
            containerCss: '',
            blocks: [
                {css: '', content: '<strong>Left</strong>'},
                {css: '', content: 'Right'},
            ],
        });
        expect(result[1]).toMatchObject({
            id: 'card',
            title: 'Card',
            type: 'block',
            block: {css: '', content: '<div style="padding:12px">Card text</div>'},
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
            containerCss: '',
            blocks: [
                {css: '', content: 'First'},
                {css: '', content: '<em>Second</em>'},
            ],
        });
    });

    it('parses group, style tags and remaining html for a container template', () => {
        const [template] = parseTemplates(`
            <template id="styled-grid" title="Styled grid" type="container" group="Theme A">
                <style>
                    .grid { display: grid; gap: 12px; }
                    a { color: inherit; }
                </style>
                <div class="grid">
                    <div>
                        <style>
                            .block-1 { padding: 12px; }
                            .block-1 strong { color: red; }
                        </style>
                        <strong>First</strong>
                    </div>
                    <div style="padding:14px">Second</div>
                </div>
            </template>
        `);

        expect(template).toMatchObject({
            id: 'styled-grid',
            title: 'Styled grid',
            group: 'Theme A',
            type: 'container',
            containerCss:
                '.grid { display: grid; gap: 12px; }\na { color: inherit; }\n\n.block-1 { padding: 12px; }\n.block-1 strong { color: red; }',
            blocks: [
                {
                    css: '',
                    content: '<strong>First</strong>',
                },
                {css: '', content: 'Second'},
            ],
        });
    });

    it('parses group, style tags and remaining html for a block template', () => {
        const [template] = parseTemplates(`
            <template id="card" title="Card" type="block" group="Theme A">
                <style>
                    & { padding: 12px; }
                </style>
                <strong>Card text</strong>
            </template>
        `);

        expect(template).toMatchObject({
            id: 'card',
            title: 'Card',
            group: 'Theme A',
            type: 'block',
            block: {css: '& { padding: 12px; }', content: '<strong>Card text</strong>'},
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

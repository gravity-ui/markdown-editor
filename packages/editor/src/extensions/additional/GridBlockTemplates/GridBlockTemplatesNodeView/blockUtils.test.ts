import type {GridBlock} from '../types';

import {buildContainerHtml, containerTemplateToAttrs, parseContainerHtml} from './blockUtils';

const blocks: GridBlock[] = [
    {id: 'block-a', css: '& { color: red; }', content: '<strong>First</strong>'},
    {id: 'block-b', css: '& { color: blue; }', content: 'Second'},
];

describe('GridBlockTemplates block utils', () => {
    describe('buildContainerHtml', () => {
        it('builds a grid html draft from blocks', () => {
            expect(buildContainerHtml(blocks)).toBe(
                [
                    '<div class="grid">',
                    '  <div class="block-1"><strong>First</strong></div>',
                    '  <div class="block-2">Second</div>',
                    '</div>',
                ].join('\n'),
            );
        });
    });

    describe('parseContainerHtml', () => {
        it('rebuilds blocks and preserves existing ids and css by index', () => {
            expect(
                parseContainerHtml(
                    [
                        '<div class="grid">',
                        '  <div style="padding:8px"><em>First</em></div>',
                        '  <div>Second updated</div>',
                        '</div>',
                    ].join('\n'),
                    blocks,
                ),
            ).toEqual([
                {id: 'block-a', css: '& {\n  padding:8px;\n}', content: '<em>First</em>'},
                {id: 'block-b', css: '& { color: blue; }', content: 'Second updated'},
            ]);
        });

        it('clears blocks for blank html', () => {
            expect(parseContainerHtml('   ', blocks)).toEqual([]);
        });

        it('ignores html without a grid root', () => {
            expect(parseContainerHtml('<section><div>First</div></section>', blocks)).toBeNull();
        });
    });

    describe('containerTemplateToAttrs', () => {
        it('keeps existing blocks when applying a css-only container template', () => {
            expect(
                containerTemplateToAttrs(
                    {
                        id: 'theme',
                        title: 'Theme',
                        type: 'container',
                        content: '<style>.grid { gap: 16px; }</style>',
                        containerCss: '.grid { gap: 16px; }',
                        blocks: [],
                    },
                    blocks,
                ),
            ).toEqual({
                customCss: '.grid { gap: 16px; }',
                blocks,
            });
        });
    });
});

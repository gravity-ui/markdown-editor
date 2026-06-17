import type {GridBlockBlockTemplate, GridBlockContainerTemplate} from '../types';

import {deriveBlockCss, getBlockTemplatesForMenu} from './derivedBlockTemplates';

const blockTemplate = (content: string): GridBlockBlockTemplate => ({
    id: 'explicit',
    title: 'Explicit',
    type: 'block',
    content,
    block: {css: '', content},
});

const containerTemplate = (
    blocks: GridBlockContainerTemplate['blocks'],
    containerCss = '',
): GridBlockContainerTemplate => ({
    id: 'container',
    title: 'Container',
    group: 'Group',
    type: 'container',
    content: '',
    containerCss,
    blocks,
});

describe('GridBlockTemplates derived block templates', () => {
    it('keeps explicit templates and derives missing blocks from containers', () => {
        expect(
            getBlockTemplatesForMenu({
                blockTemplates: [blockTemplate('<h2>Existing</h2>')],
                containerTemplates: [
                    containerTemplate([
                        {css: '', content: '<h2>Existing</h2>'},
                        {css: '', content: '<strong>New block</strong>'},
                    ]),
                ],
            }),
        ).toMatchObject([
            {id: 'explicit', title: 'Explicit'},
            {
                id: 'container__block-2',
                title: 'New block',
                group: 'Group',
                block: {content: '<strong>New block</strong>'},
            },
        ]);
    });

    it('uses aria-label and image alt as derived titles', () => {
        const result = getBlockTemplatesForMenu({
            blockTemplates: [],
            containerTemplates: [
                containerTemplate([
                    {css: '', content: '<a aria-label="CTA"></a>'},
                    {css: '', content: '<img src="x.png" alt="Preview">'},
                    {css: '', content: '<div></div>'},
                ]),
            ],
        });

        expect(result.map((template) => template.title)).toEqual(['CTA', 'Preview', 'Block 3']);
    });

    it('rewrites block and shared grid selectors for standalone blocks', () => {
        expect(
            deriveBlockCss(
                [
                    '.grid { color: #111; }',
                    '.grid * { box-sizing: border-box; }',
                    '.block-1, .block-2 { min-width: 0; }',
                    '.block-1 .title, .block-2 .title { margin: 0; }',
                    '.shared { font: inherit; }',
                ].join('\n'),
                1,
            ),
        ).toBe(
            [
                '& {\n  color: #111;\n}',
                '& * {\n  box-sizing: border-box;\n}',
                '& {\n  min-width: 0;\n}',
                '& .title {\n  margin: 0;\n}',
                '.shared {\n  font: inherit;\n}',
            ].join('\n\n'),
        );
    });

    it('rewrites nested media rules recursively', () => {
        expect(
            deriveBlockCss(
                [
                    '@media (max-width: 900px) {',
                    '  .block-2 { grid-template-columns: 1fr; }',
                    '  .block-1 { display: none; }',
                    '  .grid a { color: inherit; }',
                    '}',
                ].join('\n'),
                2,
            ),
        ).toBe(
            [
                '@media (max-width: 900px) {',
                '  & {',
                '    grid-template-columns: 1fr;',
                '  }',
                '',
                '  & a {',
                '    color: inherit;',
                '  }',
                '}',
            ].join('\n'),
        );
    });
});

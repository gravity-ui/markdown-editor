import type {Node} from 'prosemirror-model';

import {buildYfmHtmlConstructorHtml} from '../YfmHtmlConstructorSpecs';
import {getEnabledHtmlConstructorSettings} from '../settings';
import {parseTemplates} from '../templates';

import {getNextQuickStyle} from './FloatingToolbar';
import {
    applyBlockTemplateToBlock,
    applyBlockThemeToBlock,
    applyStructureThemeToState,
    blockTemplateToBlock,
    buildPreviewCss,
    cloneHtmlConstructorBlock,
    getDirectStructureBlocks,
    structureTemplateToAttrs,
} from './blockUtils';

const templates = () =>
    parseTemplates(`
        <template type="structure" id="landing" title="Landing">
            <style>& { display: grid; }</style>
            <section>Intro</section>
        </template>
        <template type="block" id="hero" title="Hero" structure="landing">
            <style>& { padding: 12px; }</style>
            <section>Hero</section>
        </template>
        <template type="block" id="card" title="Card" structure="landing">
            <style>.card { color: red; }</style>
            <article class="card">Card</article>
        </template>
        <template type="block" id="card-alt" title="Card alt" block="card">
            <style>& { color: blue; }</style>
            <article>Alt</article>
        </template>
        <template type="theme" id="compact" title="Compact" structure="landing">
            <style>.g-md-hc-structure { gap: 8px; }</style>
        </template>
        <template type="theme" id="card-dark" title="Card dark" block="card">
            <style>.g-md-hc-block { background: #000; }</style>
        </template>
    `);

describe('YfmHtmlConstructor utils', () => {
    it('enables all toolbar controls for default or missing settings', () => {
        expect(getEnabledHtmlConstructorSettings(undefined)).toEqual({
            hasBackground: true,
            hasRound: true,
            hasBorder: true,
            hasTextColor: true,
            hasDelete: true,
            hasRaw: true,
        });
        expect(
            getEnabledHtmlConstructorSettings({
                hasBackground: false,
                hasRound: false,
                hasBorder: false,
                hasTextColor: false,
                hasDelete: false,
                hasRaw: false,
                preset: 'default',
            }),
        ).toEqual({
            hasBackground: true,
            hasRound: true,
            hasBorder: true,
            hasTextColor: true,
            hasDelete: true,
            hasRaw: true,
        });
    });

    it('enables only explicit toolbar controls for none preset', () => {
        expect(
            getEnabledHtmlConstructorSettings({
                hasBackground: true,
                hasRound: false,
                hasBorder: true,
                hasTextColor: false,
                hasDelete: true,
                hasRaw: false,
                preset: 'none',
            }),
        ).toEqual({
            hasBackground: true,
            hasRound: false,
            hasBorder: true,
            hasTextColor: false,
            hasDelete: true,
            hasRaw: false,
        });
    });

    it('finds direct blocks for a structure without block states', () => {
        expect(
            getDirectStructureBlocks(templates(), 'landing').map((template) => template.id),
        ).toEqual(['hero', 'card']);
    });

    it('replaces current constructor state when applying a structure', () => {
        const all = templates();
        const structure = all.find(
            (template) => template.type === 'structure' && template.id === 'landing',
        );
        const theme = all.find(
            (template) => template.type === 'theme' && template.id === 'compact',
        );

        expect(structure?.type).toBe('structure');
        expect(theme?.type).toBe('theme');
        if (structure?.type !== 'structure' || theme?.type !== 'theme') return;

        const result = structureTemplateToAttrs(all, structure, theme);

        expect(result.structure).toMatchObject({
            templateId: 'landing',
            content: '<section>Intro</section>',
            themeIds: ['compact'],
        });
        expect(result.structure.css).toContain('& { display: grid; }');
        expect(result.structure.css).toContain('.g-md-hc-structure { gap: 8px; }');
        expect(result.blocks).toHaveLength(2);
        expect(result.blocks).toMatchObject([{templateId: 'hero'}, {templateId: 'card'}]);
    });

    it('creates a block instance with selected block theme css', () => {
        const all = templates();
        const block = all.find((template) => template.type === 'block' && template.id === 'card');
        const theme = all.find(
            (template) => template.type === 'theme' && template.id === 'card-dark',
        );

        expect(block?.type).toBe('block');
        expect(theme?.type).toBe('theme');
        if (block?.type !== 'block' || theme?.type !== 'theme') return;

        const result = blockTemplateToBlock(block, theme);

        expect(result).toMatchObject({
            templateId: 'card',
            content: '<article class="card">Card</article>',
            themeIds: ['card-dark'],
        });
        expect(result.css).toContain('.card { color: red; }');
        expect(result.css).toContain('.g-md-hc-block { background: #000; }');
    });

    it('builds preview css using g-md-hc wrappers for ampersand selectors', () => {
        const all = templates();
        const structure = all.find(
            (template) => template.type === 'structure' && template.id === 'landing',
        );
        const block = all.find((template) => template.type === 'block' && template.id === 'hero');

        expect(structure?.type).toBe('structure');
        expect(block?.type).toBe('block');
        if (structure?.type !== 'structure' || block?.type !== 'block') return;

        expect(
            buildPreviewCss({
                structure: structureTemplateToAttrs(all, structure).structure,
                blocks: [blockTemplateToBlock(block)],
            }),
        ).toContain('.g-md-hc-structure.g-md-hc-structure-1 { display: grid; }');
        expect(
            buildPreviewCss({
                structure: structureTemplateToAttrs(all, structure).structure,
                blocks: [blockTemplateToBlock(block)],
            }),
        ).toContain('.g-md-hc-block.g-md-hc-block-1 { padding: 12px; }');
    });

    it('serializes quick styles to structure and block wrappers', () => {
        const html = buildYfmHtmlConstructorHtml({
            attrs: {
                structure: {
                    css: '',
                    content: '<section>Intro</section>',
                    themeIds: [],
                    quickStyle: {
                        background: '#ffffff',
                        borderRadius: '12px',
                    },
                },
                blocks: [
                    {
                        id: 'block',
                        css: '',
                        content: '<article>Block</article>',
                        themeIds: [],
                        quickStyle: {
                            textColor: '#2f6fe0',
                            borderStyle: 'dashed',
                        },
                    },
                ],
            },
        } as unknown as Node);

        expect(html).toContain('style="background: #ffffff; border-radius: 12px;"');
        expect(html).toContain(
            'style="color: #2f6fe0; border: 1px dashed var(--g-color-line-generic);"',
        );
    });

    it('clones block instances with a new runtime id and preserved data', () => {
        const block = {
            id: 'block',
            templateId: 'card',
            css: '& { padding: 12px; }',
            content: '<article>Card</article>',
            themeIds: ['theme'],
            quickStyle: {background: '#ffffff'},
        };
        const result = cloneHtmlConstructorBlock(block);

        expect(result).toMatchObject({...block, id: expect.any(String)});
        expect(result.id).not.toBe(block.id);
    });

    it('replaces block state while preserving runtime id and quick style', () => {
        const all = templates();
        const state = all.find(
            (template) => template.type === 'block' && template.id === 'card-alt',
        );
        const theme = all.find(
            (template) => template.type === 'theme' && template.id === 'card-dark',
        );

        expect(state?.type).toBe('block');
        expect(theme?.type).toBe('theme');
        if (state?.type !== 'block' || theme?.type !== 'theme') return;

        const result = applyBlockTemplateToBlock(
            {
                id: 'runtime-id',
                templateId: 'card',
                css: 'old css',
                content: '<article>Edited</article>',
                themeIds: ['old-theme'],
                quickStyle: {textColor: '#2f6fe0'},
            },
            state,
            theme,
        );

        expect(result).toMatchObject({
            id: 'runtime-id',
            templateId: 'card-alt',
            content: '<article>Alt</article>',
            themeIds: ['card-dark'],
            quickStyle: {textColor: '#2f6fe0'},
        });
        expect(result.css).toContain('& { color: blue; }');
        expect(result.css).toContain('.g-md-hc-block { background: #000; }');
    });

    it('replaces structure and block themes without accumulating previous theme css', () => {
        const all = templates();
        const structure = all.find(
            (template) => template.type === 'structure' && template.id === 'landing',
        );
        const structureTheme = all.find(
            (template) => template.type === 'theme' && template.id === 'compact',
        );
        const block = all.find((template) => template.type === 'block' && template.id === 'card');
        const blockTheme = all.find(
            (template) => template.type === 'theme' && template.id === 'card-dark',
        );

        expect(structure?.type).toBe('structure');
        expect(structureTheme?.type).toBe('theme');
        expect(block?.type).toBe('block');
        expect(blockTheme?.type).toBe('theme');
        if (
            structure?.type !== 'structure' ||
            structureTheme?.type !== 'theme' ||
            block?.type !== 'block' ||
            blockTheme?.type !== 'theme'
        ) {
            return;
        }

        const nextStructure = applyStructureThemeToState(
            {
                templateId: 'landing',
                css: 'old structure theme',
                content: '<section>Edited intro</section>',
                themeIds: ['old-theme'],
                quickStyle: {borderRadius: '12px'},
            },
            structure,
            structureTheme,
        );
        const nextBlock = applyBlockThemeToBlock(
            {
                id: 'runtime-id',
                templateId: 'card',
                css: 'old block theme',
                content: '<article>Edited card</article>',
                themeIds: ['old-theme'],
                quickStyle: {background: '#ffffff'},
            },
            block,
            blockTheme,
        );

        expect(nextStructure).toMatchObject({
            content: '<section>Edited intro</section>',
            themeIds: ['compact'],
            quickStyle: {borderRadius: '12px'},
        });
        expect(nextStructure.css).toContain('& { display: grid; }');
        expect(nextStructure.css).toContain('.g-md-hc-structure { gap: 8px; }');
        expect(nextStructure.css).not.toContain('old structure theme');

        expect(nextBlock).toMatchObject({
            content: '<article>Edited card</article>',
            themeIds: ['card-dark'],
            quickStyle: {background: '#ffffff'},
        });
        expect(nextBlock.css).toContain('.card { color: red; }');
        expect(nextBlock.css).toContain('.g-md-hc-block { background: #000; }');
        expect(nextBlock.css).not.toContain('old block theme');
    });

    it('applies border quick style patches from the combined border dropdown', () => {
        expect(
            getNextQuickStyle(
                {background: '#ffffff'},
                {borderStyle: 'dashed', borderRadius: '12px'},
            ),
        ).toEqual({
            background: '#ffffff',
            borderStyle: 'dashed',
            borderRadius: '12px',
        });
        expect(
            getNextQuickStyle(
                {borderStyle: 'dashed', borderRadius: '12px'},
                {borderStyle: undefined},
            ),
        ).toEqual({borderRadius: '12px'});
    });
});

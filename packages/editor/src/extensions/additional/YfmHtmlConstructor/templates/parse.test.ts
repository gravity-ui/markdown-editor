import {readFileSync} from 'node:fs';
import path from 'node:path';

import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructureTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

import {
    HtmlConstructorTemplateParseError,
    parseRawBlock,
    parseTemplateBlock,
    parseTemplates,
} from './parse';

const gravityUiLandingFixture = path.resolve(
    __dirname,
    '../../../../../../../demo/src/defaults/yfm-html-constructor/gravity-ui-landing.html',
);

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
    it('extracts top-level styles and removes nested styles', () => {
        expect(
            parseTemplateBlock(
                '<style>& { padding: 12px; }</style><section><style>strong { color: red; }</style><strong>Text</strong></section>',
            ),
        ).toEqual({
            css: '& { padding: 12px; }',
            content: '<section><strong>Text</strong></section>',
        });
    });
});

describe('parseTemplates', () => {
    it('parses the Gravity UI landing template pack', () => {
        const result = parseTemplates(readFileSync(gravityUiLandingFixture, 'utf8'));

        expect(result.filter((template) => template.type === 'family')).toHaveLength(1);
        expect(result.filter((template) => template.type === 'structure')).toHaveLength(1);
        expect(result.filter((template) => template.type === 'block')).toHaveLength(10);
        expect(result.filter((template) => template.type === 'theme')).toHaveLength(8);
    });

    it('parses families, structures, blocks and themes', () => {
        const result = parseTemplates(`
            <template type="family" id="marketing" title="Marketing">
                <style>.cover { color: red; }</style>
                <div class="cover">Cover</div>
            </template>
            <template type="structure" id="landing" title="Landing" family="marketing" data-has-raw>
                <style>
                    .g-md-hc-structure { display: grid; }
                </style>
                <section>Intro</section>
            </template>
            <template type="block" id="card" title="Card" structure="landing" family="marketing">
                <style>& { padding: 12px; }</style>
                <article>Card</article>
            </template>
            <template type="theme" id="compact" title="Compact" structure="landing" priority="10">
                <style>.g-md-hc-structure { gap: 8px; }</style>
                <div>Ignored</div>
            </template>
        `);

        expect(result[0]).toMatchObject({
            type: 'family',
            id: 'marketing',
            title: 'Marketing',
            styles: ['.cover { color: red; }'],
            content: '<div class="cover">Cover</div>',
        });
        expect(result[1]).toMatchObject({
            type: 'structure',
            id: 'landing',
            family: 'marketing',
            settings: {hasRaw: true, preset: 'default'},
            styles: ['.g-md-hc-structure { display: grid; }'],
        });
        expect(result[1]).not.toHaveProperty('content');
        expect(result[2]).toMatchObject({
            type: 'block',
            id: 'card',
            structure: 'landing',
            styles: ['& { padding: 12px; }'],
            content: '<article>Card</article>',
        });
        expect(result[3]).toMatchObject({
            type: 'theme',
            id: 'compact',
            structure: 'landing',
            styles: ['.g-md-hc-structure { gap: 8px; }'],
        });
    });

    it('sorts structures, blocks and themes by priority then declaration index', () => {
        const result = parseTemplates(`
            <template type="structure" id="b" priority="10"></template>
            <template type="structure" id="a" priority="-1"></template>
            <template type="block" id="block-b" priority="2"></template>
            <template type="block" id="block-a" priority="1"></template>
            <template type="theme" id="theme-b" priority="2"></template>
            <template type="theme" id="theme-a" priority="1"></template>
        `);

        expect(
            result
                .filter(
                    (template): template is HtmlConstructorStructureTemplate =>
                        template.type === 'structure',
                )
                .map((template) => template.id),
        ).toEqual(['a', 'b']);
        expect(
            result
                .filter(
                    (template): template is HtmlConstructorBlockTemplate =>
                        template.type === 'block',
                )
                .map((template) => template.id),
        ).toEqual(['block-a', 'block-b']);
        expect(
            result
                .filter(
                    (template): template is HtmlConstructorThemeTemplate =>
                        template.type === 'theme',
                )
                .map((template) => template.id),
        ).toEqual(['theme-a', 'theme-b']);
    });

    it('parses none preset with explicitly enabled template controls', () => {
        const [template] = parseTemplates(`
            <template
                type="block"
                id="card"
                data-preset="none"
                data-has-background
                data-has-border
            ></template>
        `);

        expect(template).toMatchObject({
            type: 'block',
            settings: {
                hasBackground: true,
                hasRound: false,
                hasBorder: true,
                hasTextColor: false,
                hasDelete: false,
                hasRaw: false,
                preset: 'none',
            },
        });
    });

    it.each([
        ['unknown attribute', '<template type="block" id="x" group="bad"></template>'],
        [
            'duplicate id',
            '<template type="block" id="x"></template><template type="block" id="x"></template>',
        ],
        ['bad family reference', '<template type="block" id="x" family="missing"></template>'],
        [
            'bad structure reference',
            '<template type="block" id="x" structure="missing"></template>',
        ],
        ['bad block reference', '<template type="theme" id="x" block="missing"></template>'],
        ['invalid priority', '<template type="block" id="x" priority="nope"></template>'],
        ['invalid data-preset', '<template type="block" id="x" data-preset="bad"></template>'],
        ['theme settings', '<template type="theme" id="x" data-has-raw></template>'],
        ['top-level non-template', '<section></section>'],
    ])('rejects %s', (_name, input) => {
        expect(() => parseTemplates(input)).toThrow(HtmlConstructorTemplateParseError);
    });

    it('returns an empty array for blank input', () => {
        expect(parseTemplates('   ')).toEqual([]);
        expect(parseTemplates('')).toEqual([]);
    });
});

import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {labelColors, labelPlugin} from './index';

const md = new MarkdownIt().use(labelPlugin);

const html = (color: string, text: string) =>
    `<span class="g-md-label-plugin g-md-label-plugin_color_${color}" data-color="${color}">` +
    `<span class="g-md-label-plugin__text">${text}</span></span>`;

describe('Label Markdown', () => {
    it('should list the neutral color and five semantic colors in the palette order', () => {
        expect(labelColors).toEqual(['gray', 'green', 'yellow', 'blue', 'red', 'purple']);
    });

    it.each(labelColors)('should render the %s color', (color) => {
        expect(md.renderInline(`:label[In progress]{color=${color}}`)).toBe(
            html(color, 'In progress'),
        );
    });

    it('should use gray without the color attribute', () => {
        expect(md.renderInline(':label[In progress]')).toBe(html('gray', 'In progress'));
    });

    it('should keep text around the label', () => {
        expect(md.renderInline('Task is :label[done]{color=green} already')).toBe(
            `Task is ${html('green', 'done')} already`,
        );
    });

    it('should read the former status directive', () => {
        expect(md.renderInline(':status[done]{color=green}')).toBe(html('green', 'done'));
    });

    it.each([
        ['teal', 'blue'],
        ['lime', 'green'],
        ['orange', 'yellow'],
        ['magenta', 'purple'],
    ])('should map the former %s color to %s', (legacyColor, color) => {
        expect(md.renderInline(`:status[Done]{color=${legacyColor}}`)).toBe(html(color, 'Done'));
    });

    it.each(['pink', 'constructor', 'toString'])(
        'should use gray for the unsupported color %j',
        (color) => {
            expect(md.renderInline(`:label[Done]{color=${color}}`)).toBe(html('gray', 'Done'));
        },
    );

    it.each([':label[Done]{size=l}', ':label[Done]{.custom #id}', ':label[Done]{onclick=x}'])(
        'should skip an unsupported attribute in %j',
        (markup) => {
            expect(md.renderInline(markup)).toBe(html('gray', 'Done'));
        },
    );

    it.each([':label[]', ':label[  ]{color=red}'])(
        'should leave a directive without a caption as text in %j',
        (markup) => {
            expect(md.renderInline(markup)).not.toContain('g-md-label-plugin');
        },
    );

    it('should unescape brackets and backslashes in the caption', () => {
        expect(md.renderInline(':label[a\\] b \\\\ c]')).toBe(html('gray', 'a] b \\ c'));
    });

    it('should keep markup characters in the caption as plain text', () => {
        expect(md.renderInline(':label[**bold** `code`]')).toBe(html('gray', '**bold** `code`'));
    });

    it('should escape html in the caption', () => {
        expect(md.renderInline(':label[<b>x</b>]')).toBe(html('gray', '&lt;b&gt;x&lt;/b&gt;'));
    });

    it('should emit one label token with the caption and the color', () => {
        const [inline] = md.parse(':label[Done]{color=red}', {}).slice(1, 2);
        const token = inline.children?.[0];

        expect(token?.type).toBe('label');
        expect(token?.content).toBe('Done');
        expect(token?.attrGet('data-color')).toBe('red');
    });
});

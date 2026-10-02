import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseSchemaSpecs} from '../../base/specs';

import {HeaderSpecs, headerDirective} from './HeaderSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => {
        builder.context.set('directiveSyntax', new DirectiveContext(undefined));
        builder.use(BaseSchemaSpecs, {}).use(HeaderSpecs);
    },
}).buildDeps();

describe('Header extension', () => {
    it('should parse a cover with title, paragraphs and actions', () => {
        const markup = [
            ':::header[Портал команды]{bg="gradient" fill="indigo" fill2="violet"}',
            '',
            '::action[Открыть график](/wiki/duty){type="button" color="brand"}',
            '',
            'Подзаголовок.',
            '',
            'Ещё один абзац.',
            '',
            ':::',
        ].join('\n');
        const node = parser.parse(markup).firstChild;

        expect(node?.type.name).toBe('header');
        expect(node?.firstChild?.textContent).toBe('Портал команды');
        expect(node?.child(1).childCount).toBe(2);
        expect(node?.child(2).childCount).toBe(1);
        expect(node?.child(2).firstChild?.attrs.href).toBe('/wiki/duty');
        const restored = parser.parse(serializer.serialize(parser.parse(markup))).firstChild;
        expect(restored?.child(2).firstChild?.textContent).toBe('Открыть график');
    });

    it('should filter unsupported blocks from the cover', () => {
        const markup = [
            ':::header[Заголовок]',
            '',
            '# Вложенный заголовок',
            '',
            'Текст',
            '',
            ':::',
        ].join('\n');
        const node = parser.parse(markup).firstChild;

        expect(node?.child(1).childCount).toBe(1);
        expect(node?.child(1).textContent).toBe('Текст');
    });

    it('should keep at most two actions', () => {
        const markup = [
            ':::header[Заголовок]',
            '',
            '::action[Один](/one)',
            '',
            '::action[Два](/two)',
            '',
            '::action[Три](/three)',
            '',
            ':::',
        ].join('\n');
        expect(parser.parse(markup).firstChild?.child(2).childCount).toBe(2);
    });

    it('should normalize unsupported parameter values', () => {
        const markup = [':::header[Заголовок]{bg="rainbow" fill="magenta"}', '', ':::'].join('\n');
        const node = parser.parse(markup).firstChild;

        expect(node?.attrs.bg).toBe('shapes');
        expect(node?.attrs.fill).toBe('blue');
    });

    it('should treat title markup as plain text', () => {
        const markup = [':::header[**Портал** команды]', '', ':::'].join('\n');
        const title = parser.parse(markup).firstChild?.firstChild;
        expect(title?.textContent).toBe('**Портал** команды');
        expect(title?.firstChild?.marks).toHaveLength(0);
    });

    it('should serialize the cover and keep its content', () => {
        const markup = [':::header[Заголовок]{fill="blue"}', '', 'Подзаголовок.', '', ':::'].join(
            '\n',
        );
        const doc = parser.parse(markup);
        const serialized = serializer.serialize(doc);
        const restored = parser.parse(serialized);

        expect(serialized).toContain(':::header[Заголовок]{fill="blue"}');
        expect(serialized).toContain('Подзаголовок.');
        expect(restored.firstChild?.child(1).textContent).toBe('Подзаголовок.');
    });

    it('should keep a standalone action outside a cover', () => {
        const doc = parser.parse('::action[Подробнее](/wiki/help){type="link"}');
        expect(doc.firstChild?.type.name).toBe('header_action');
    });

    it('should preserve punctuation in action labels', () => {
        const doc = parser.parse('::action[Подробнее **здесь**](/wiki/help)');
        expect(doc.firstChild?.textContent).toBe('Подробнее **здесь**');
    });

    it('should render the same slots in standalone Markdown', () => {
        const markup = [
            ':::header[Портал команды]{bg="gradient" fill="indigo" fill2="violet"}',
            '',
            'Текст.',
            '',
            '::action[Подробнее](/wiki/help)',
            '',
            ':::',
        ].join('\n');
        const html = new MarkdownIt().use(headerDirective).render(markup);
        expect(html).toContain('class="g-md-header"');
        expect(html).toContain('class="header_content"');
        expect(html).toContain('class="header_actions"');
        expect(html).toContain('href="/wiki/help"');
        expect(html).toContain('Текст.');
        parseDOM(schema, html, parser.parse(markup));
    });

    it('should preserve escaped characters in the title', () => {
        const markup = [
            ':::header[Портал &#91;Вики&#93; &amp; помощь]{fill="blue"}',
            '',
            ':::',
        ].join('\n');
        const restored = parser.parse(serializer.serialize(parser.parse(markup)));
        expect(restored.firstChild?.firstChild?.textContent).toBe('Портал [Вики] & помощь');
    });
});

import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/specs';

import {HeaderSpecs, headerNodeName} from './HeaderSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(HeaderSpecs),
}).buildDeps();

const {doc, p, bq, header} = builders<'doc' | 'p' | 'bq' | 'header'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    header: {nodeType: headerNodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Header extension', () => {
    it('should parse and serialize a header with the default fill', () => {
        same('::header[Портал команды Вики]{fill="blue"}', doc(header('Портал команды Вики')));
    });

    it('should keep an empty title', () => {
        same('::header[]{fill="blue"}', doc(header()));
    });

    it('should serialize the compact format', () => {
        same(
            '::header[Дежурства]{format="small" fill="blue"}',
            doc(header({format: 'small'}, 'Дежурства')),
        );
    });

    it('should serialize the second color only for gradient and mesh', () => {
        same(
            '::header[Градиент]{bg="gradient" fill="blue" fill2="teal"}',
            doc(header({bg: 'gradient', fill2: 'teal'}, 'Градиент')),
        );
        same(
            '::header[Меш]{bg="mesh" fill="indigo" fill2="red"}',
            doc(header({bg: 'mesh', fill: 'indigo', fill2: 'red'}, 'Меш')),
        );
    });

    it('should serialize shapes and seed only where they are drawn', () => {
        same(
            '::header[Без фигур]{fill="blue" decor="none"}',
            doc(header({decor: 'none', seed: 42}, 'Без фигур')),
        );
        same('::header[С фигурами]{fill="blue" seed="42"}', doc(header({seed: 42}, 'С фигурами')));
    });

    it('should serialize image attributes only for the image background', () => {
        same(
            '::header[Фото]{bg="image" effect="dim" image="https://example.com/hero.png" text="light"}',
            doc(
                header(
                    {
                        bg: 'image',
                        effect: 'dim',
                        image: 'https://example.com/hero.png',
                        text: 'light',
                        fill: 'blue',
                    },
                    'Фото',
                ),
            ),
        );
    });

    it('should escape square brackets in the title', () => {
        same('::header[Отчёт &#91;черновик&#93;]{fill="blue"}', doc(header('Отчёт [черновик]')));
    });

    it('should keep an ampersand and an entity written by the author', () => {
        same('::header[Дизайн &amp; код]{fill="blue"}', doc(header('Дизайн & код')));
        same('::header[Скобка &amp;#91;]{fill="blue"}', doc(header('Скобка &#91;')));
    });

    it('should work inside a blockquote', () => {
        same('> ::header[В цитате]{fill="blue"}', doc(bq(header('В цитате'))));
    });

    it('should replace unknown values with defaults', () => {
        const parsed = parser.parse('::header[Чужой markdown]{format="huge" fill="magenta"}');
        const node = parsed.firstChild!;

        expect(node.type.name).toBe(headerNodeName);
        expect(node.attrs.format).toBe('large');
        expect(node.attrs.fill).toBe('blue');
    });

    it('should keep the paragraph after a header', () => {
        same('::header[Заголовок]{fill="blue"}\n\nТекст', doc(header('Заголовок'), p('Текст')));
    });
});

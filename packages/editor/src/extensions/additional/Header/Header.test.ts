import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/specs';
import {CutAttr, CutNode, YfmCutSpecs} from '../../yfm/YfmCut/YfmCutSpecs';

import {HeaderSpecs, headerHtml, headerNodeName, normalizeHeaderAttrs} from './HeaderSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => {
        builder.context.set('directiveSyntax', new DirectiveContext(undefined));
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(YfmCutSpecs, {}).use(HeaderSpecs);
    },
}).buildDeps();

const {doc, p, bq, cut, cutTitle, cutContent, header} = builders<
    'doc' | 'p' | 'bq' | 'cut' | 'cutTitle' | 'cutContent' | 'header'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    cut: {nodeType: CutNode.Cut},
    cutTitle: {nodeType: CutNode.CutTitle},
    cutContent: {nodeType: CutNode.CutContent},
    header: {nodeType: headerNodeName},
});

const {same, serialize} = createMarkupChecker({parser, serializer});

/** Атрибут остаётся в ноде и после того, как перестал быть применимым: проверяется только разметка. */
const serializesTo = (markup: string, expected: string) =>
    serialize(parser.parse(markup), expected);

const html = (patch: Record<string, unknown>, title: string) =>
    headerHtml(normalizeHeaderAttrs(patch), title, (value) => value);

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
        serializesTo(
            '::header[Заливка]{bg="fill" fill2="teal"}',
            '::header[Заливка]{bg="fill" fill="blue"}',
        );
    });

    it('should serialize the seed only where shapes are drawn', () => {
        serializesTo(
            '::header[Без фигур]{bg="fill" seed="42"}',
            '::header[Без фигур]{bg="fill" fill="blue"}',
        );
        same('::header[С фигурами]{fill="blue" seed="42"}', doc(header({seed: 42}, 'С фигурами')));
    });

    it('should keep the background under an image', () => {
        same(
            '::header[Фото поверх меша]{bg="mesh" fill="violet" fill2="sand" image="./hero.jpg" seed="7"}',
            doc(
                header(
                    {
                        bg: 'mesh',
                        fill: 'violet',
                        fill2: 'sand',
                        image: './hero.jpg',
                        seed: 7,
                    },
                    'Фото поверх меша',
                ),
            ),
        );
    });

    it('should serialize the gradient angle only for a gradient', () => {
        same(
            '::header[Свой угол]{bg="gradient" fill="indigo" fill2="violet" angle="110"}',
            doc(header({bg: 'gradient', fill: 'indigo', fill2: 'violet', angle: 110}, 'Свой угол')),
        );
        serializesTo(
            '::header[Угол по умолчанию]{bg="gradient" angle="163"}',
            '::header[Угол по умолчанию]{bg="gradient" fill="blue"}',
        );
        serializesTo(
            '::header[Заливка]{bg="fill" angle="110"}',
            '::header[Заливка]{bg="fill" fill="blue"}',
        );
    });

    it('should serialize the tile step for a pattern and for a tiled image', () => {
        same(
            '::header[Паттерн]{bg="pattern" fill="sky" step="48"}',
            doc(header({bg: 'pattern', fill: 'sky', step: 48}, 'Паттерн')),
        );
        same(
            '::header[Плитка из файла]{bg="fill" fill="sky" image="./tile.png" layer="tile" step="28"}',
            doc(
                header(
                    {bg: 'fill', fill: 'sky', image: './tile.png', layer: 'tile', step: 28},
                    'Плитка из файла',
                ),
            ),
        );
        serializesTo(
            '::header[Шаг по умолчанию]{bg="pattern" step="32"}',
            '::header[Шаг по умолчанию]{bg="pattern" fill="blue"}',
        );
        serializesTo('::header[Заливка]{fill="blue" step="48"}', '::header[Заливка]{fill="blue"}');
    });

    it('should serialize the layer, the fit and the crop only with an image', () => {
        same(
            '::header[Декор из файла]{bg="fill" fill="sand" image="./decor.svg" layer="decor" fit="height" crop="right"}',
            doc(
                header(
                    {
                        bg: 'fill',
                        fill: 'sand',
                        image: './decor.svg',
                        layer: 'decor',
                        fit: 'height',
                        crop: 'right',
                    },
                    'Декор из файла',
                ),
            ),
        );
        same(
            '::header[Кадрирование]{fill="navy" image="./hero.jpg" fit="contain" crop="top-right" text="light"}',
            doc(
                header(
                    {
                        fill: 'navy',
                        image: './hero.jpg',
                        fit: 'contain',
                        crop: 'top-right',
                        text: 'light',
                    },
                    'Кадрирование',
                ),
            ),
        );
        serializesTo(
            '::header[Без снимка]{fill="blue" layer="decor" fit="contain" crop="top"}',
            '::header[Без снимка]{fill="blue"}',
        );
    });

    it('should serialize every fit value', () => {
        for (const fit of ['contain', 'width', 'height']) {
            same(
                `::header[Масштаб]{fill="blue" image="./hero.jpg" fit="${fit}"}`,
                doc(header({image: './hero.jpg', fit}, 'Масштаб')),
            );
        }
        serializesTo(
            '::header[Масштаб]{fill="blue" image="./hero.jpg" fit="cover"}',
            '::header[Масштаб]{fill="blue" image="./hero.jpg"}',
        );
    });

    it('should serialize every crop value', () => {
        for (const crop of [
            'top',
            'right',
            'bottom',
            'left',
            'top-left',
            'top-right',
            'bottom-right',
            'bottom-left',
        ]) {
            same(
                `::header[Кадр]{fill="blue" image="./hero.jpg" crop="${crop}"}`,
                doc(header({image: './hero.jpg', crop}, 'Кадр')),
            );
        }
        serializesTo(
            '::header[Кадр]{fill="blue" image="./hero.jpg" crop="center"}',
            '::header[Кадр]{fill="blue" image="./hero.jpg"}',
        );
    });

    it('should keep the image and its overlay next to the background', () => {
        same(
            '::header[Фото]{bg="pattern" fill="blue" effect="dim" image="https://example.com/hero.png" text="light"}',
            doc(
                header(
                    {
                        bg: 'pattern',
                        effect: 'dim',
                        image: 'https://example.com/hero.png',
                        text: 'light',
                    },
                    'Фото',
                ),
            ),
        );
    });

    it('should drop the overlay without an image', () => {
        serializesTo(
            '::header[Без снимка]{fill="blue" effect="dim"}',
            '::header[Без снимка]{fill="blue"}',
        );
    });

    it('should drop the overlay of a decor and of a tile', () => {
        serializesTo(
            '::header[Декор]{fill="blue" effect="dim" image="./decor.svg" layer="decor"}',
            '::header[Декор]{fill="blue" image="./decor.svg" layer="decor"}',
        );
        serializesTo(
            '::header[Плитка]{fill="blue" effect="blur" image="./tile.png" layer="tile"}',
            '::header[Плитка]{fill="blue" image="./tile.png" layer="tile"}',
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
        same(
            '> ::header[Градиент в цитате]{bg="gradient" fill="blue" angle="110"}',
            doc(bq(header({bg: 'gradient', angle: 110}, 'Градиент в цитате'))),
        );
    });

    it('should work inside a cut', () => {
        const markup = dd`
        {% cut "Обложка внутри ката" %}

        ::header[Плитка в кате]{bg="fill" fill="sky" image="./tile.png" layer="tile" step="28"}

        {% endcut %}
        `.trim();

        same(
            markup,
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
                    cutTitle('Обложка внутри ката'),
                    cutContent(
                        header(
                            {
                                bg: 'fill',
                                fill: 'sky',
                                image: './tile.png',
                                layer: 'tile',
                                step: 28,
                            },
                            'Плитка в кате',
                        ),
                    ),
                ),
            ),
        );
    });

    it('should replace unknown values with defaults', () => {
        const parsed = parser.parse(
            '::header[Чужой markdown]{format="huge" fill="magenta" layer="split" fit="stretch" crop="middle" step="wide" angle="round"}',
        );
        const node = parsed.firstChild!;

        expect(node.type.name).toBe(headerNodeName);
        expect(node.attrs.format).toBe('large');
        expect(node.attrs.fill).toBe('blue');
        expect(node.attrs.layer).toBe('cover');
        expect(node.attrs.fit).toBe('cover');
        expect(node.attrs.crop).toBe('center');
        expect(node.attrs.step).toBe(32);
        expect(node.attrs.angle).toBe(163);
    });

    it('should bring the angle into a single turn and refuse a negative one', () => {
        expect(parser.parse('::header[Угол]{angle="523"}').firstChild!.attrs.angle).toBe(163);
        expect(parser.parse('::header[Угол]{angle="0"}').firstChild!.attrs.angle).toBe(0);
        expect(parser.parse('::header[Угол]{angle="-10"}').firstChild!.attrs.angle).toBe(163);
    });

    it('should clamp the tile step to its range', () => {
        expect(parser.parse('::header[Шаг]{step="1"}').firstChild!.attrs.step).toBe(4);
        expect(parser.parse('::header[Шаг]{step="9000"}').firstChild!.attrs.step).toBe(512);
    });

    it('should keep a data uri of a decor file', () => {
        const svg =
            "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'><circle cx='4' cy='4' r='3' fill='white'/></svg>";

        same(
            `::header[Декор]{bg="fill" fill="sand" image="${svg}" layer="decor" fit="height"}`,
            doc(
                header(
                    {bg: 'fill', fill: 'sand', image: svg, layer: 'decor', fit: 'height'},
                    'Декор',
                ),
            ),
        );
    });

    it('should read the cover properties back from its own html', () => {
        const attrs = {
            bg: 'fill',
            fill: 'sand',
            image: 'https://example.com/decor.svg',
            layer: 'decor',
            fit: 'height',
            crop: 'right',
            angle: 110,
            step: 48,
        };

        parseDOM(schema, html(attrs, 'Из буфера'), doc(header(attrs, 'Из буфера')));
    });

    it('should keep the paragraph after a header', () => {
        same('::header[Заголовок]{fill="blue"}\n\nТекст', doc(header('Заголовок'), p('Текст')));
    });
});

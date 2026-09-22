import {builders} from 'prosemirror-test-builder';
import {describe, it} from 'vitest';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BoldSpecs, boldMarkName} from '../Bold/BoldSpecs';
import {BreakNodeName, BreaksSpecs} from '../Breaks/BreaksSpecs';
import {CodeSpecs, codeMarkName} from '../Code/CodeSpecs';
import {ImageAttr, ImageSpecs, imageNodeName} from '../Image/ImageSpecs';

import {LinkAttr, LinkSpecs, linkMarkName} from './LinkSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(LinkSpecs)
            .use(ImageSpecs)
            .use(BreaksSpecs, {})
            .use(BoldSpecs)
            .use(CodeSpecs)
            .addNodeSpec('anchor', () => ({inline: true, group: 'inline', content: 'text*'}))
            .addMarkdownTokenParserSpec('anchor', () => ({name: 'anchor', type: 'block'}))
            .addNodeSerializerSpec('anchor', () => (state, node) => {
                state.write('#[');
                state.renderInline(node);
                state.write('](anchor)');
            }),
    options: {mdOpts: {linkify: true}},
}).buildDeps();

const {doc, p, a, lnk, lnk4, img, sb, hb, bold, anchor, code} = builders<
    'doc' | 'p' | 'a' | 'lnk' | 'lnk4' | 'img' | 'sb' | 'hb' | 'bold' | 'anchor' | 'code'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    a: {nodeType: linkMarkName},
    sb: {nodeType: BreakNodeName.SoftBreak},
    hb: {nodeType: BreakNodeName.HardBreak},
    bold: {markType: boldMarkName},
    code: {markType: codeMarkName},
    anchor: {nodeType: 'anchor'},
    img: {
        nodeType: imageNodeName,
        [ImageAttr.Src]: '/path/to/img.png',
        [ImageAttr.Alt]: 'alttext',
    },
    lnk: {nodeType: linkMarkName, [LinkAttr.Href]: 'ya.ru'},
    lnk4: {
        nodeType: linkMarkName,
        [LinkAttr.Href]: '4chan.org',
        [LinkAttr.Title]: '4chan',
    },
});

const {same, parse, serialize} = createMarkupChecker({parser, serializer});

describe('Link extension', () => {
    it('should parse link', () => {
        same('[yandex](ya.ru)', doc(p(lnk('yandex'))));
    });

    it('should parse link with title', () => {
        same('[imageboard](4chan.org "4chan")', doc(p(lnk4('imageboard'))));
    });

    it('ensure no escapes in url', () => {
        same(
            '[text](https://example.com/+_file/#~anchor)',
            doc(p(a({[LinkAttr.Href]: 'https://example.com/+_file/#~anchor'}, 'text'))),
        );
    });

    it('ensure no escapes in autolinks', () => {
        same(
            '<https://example.com/+_file/#~anchor>',
            doc(
                p(
                    a(
                        {[LinkAttr.Href]: 'https://example.com/+_file/#~anchor'},
                        'https://example.com/+_file/#~anchor',
                    ),
                ),
            ),
        );
    });

    it('ensure no escapes in raw links', () => {
        serialize(
            doc(
                p(
                    a(
                        {
                            [LinkAttr.Href]: 'https://example.com/+_file/#~anchor',
                            [LinkAttr.RawLink]: true,
                        },
                        'https://example.com/+_file/#~anchor',
                    ),
                ),
            ),
            'https://example.com/+_file/#~anchor',
        );
    });

    it('should preserve a raw link followed by an image after serialization', () => {
        const href = 'https://ya.ru/';
        const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), img()));

        serialize(content, '<https://ya.ru/>![alttext](/path/to/img.png)');
        parse(serializer.serialize(content), doc(p(a({href}, href), img())));
    });

    it('should keep a raw link when a space separates it from an image', () => {
        const href = 'https://ya.ru/';

        serialize(
            doc(p(a({href, [LinkAttr.RawLink]: true}, href), ' ', img())),
            'https://ya.ru/ ![alttext](/path/to/img.png)',
        );
    });

    it.each([' ', '\t', '\n', '\r', '\u00a0', '\u2009', '\u2028', '\u2029'])(
        'should keep a raw link before whitespace %j',
        (space) => {
            const href = 'https://ya.ru/';

            serialize(
                doc(p(a({href, [LinkAttr.RawLink]: true}, href), space + 'text')),
                href + space + 'text',
            );
        },
    );

    it.each(['text', '.', ',', ':', '-', '—', '…', '\uFEFFtext'])(
        'should wrap a raw link before plain text %j',
        (text) => {
            const href = 'https://ya.ru/';
            const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), text));

            serialize(content, `<${href}>${text}`);
            parse(serializer.serialize(content), doc(p(a({href}, href), text)));
        },
    );

    it('should keep a raw link before a soft break', () => {
        const href = 'https://ya.ru/';
        const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), sb(), 'text'));

        serialize(content, href + '\ntext');
        parse(serializer.serialize(content), doc(p(a({href}, href), sb(), 'text')));
    });

    it('should wrap a raw link before a hard break', () => {
        const href = 'https://ya.ru/';
        const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), hb(), 'text'));

        serialize(content, `<${href}>\\\ntext`);
        parse(serializer.serialize(content), doc(p(a({href}, href), hb(), 'text')));
    });

    it('should wrap a raw link before marked text', () => {
        const href = 'https://ya.ru/';
        const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), bold('text')));

        serialize(content, `<${href}>**text**`);
        parse(serializer.serialize(content), doc(p(a({href}, href), bold('text'))));
    });

    it('should wrap a raw link before whitespace in marked text', () => {
        const href = 'https://ya.ru/';

        serialize(
            doc(p(a({href, [LinkAttr.RawLink]: true}, href), bold(' text'))),
            `<${href}> **text**`,
        );
    });

    it('should keep a raw link before a whitespace-only marked node', () => {
        const href = 'https://ya.ru/';
        const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), bold(' '), 'text'));

        serialize(content, href + ' text');
        parse(serializer.serialize(content), doc(p(a({href}, href), ' text')));
    });

    it('should keep a raw link before marked whitespace at the end', () => {
        const href = 'https://ya.ru/';
        serialize(doc(p(a({href, [LinkAttr.RawLink]: true}, href), bold(' '))), href + ' ');
    });

    it('should keep a raw link before marked whitespace and an image', () => {
        const href = 'https://ya.ru/';
        const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), bold(' '), img()));
        serialize(content, href + ' ![alttext](/path/to/img.png)');
        parse(serializer.serialize(content), doc(p(a({href}, href), ' ', img())));
    });

    it('should wrap a raw link before whitespace in inline code', () => {
        const href = 'https://ya.ru/';
        const content = doc(p(a({href, [LinkAttr.RawLink]: true}, href), code(' '), 'text'));
        serialize(content, `<${href}>\` \`text`);
        parse(serializer.serialize(content), doc(p(a({href}, href), code(' '), 'text')));
    });

    it('should preserve surrounding content when removing raw link brackets', () => {
        const href = 'https://ya.ru/';
        const content = doc(
            p('first'),
            p('before ', a({href, [LinkAttr.RawLink]: true}, href), bold(' '), 'after'),
            p(a({href, [LinkAttr.RawLink]: true}, href), img()),
        );

        serialize(
            content,
            `first\n\nbefore ${href} after\n\n<${href}>![alttext](/path/to/img.png)`,
        );
    });

    it('should wrap a raw link before a custom inline node', () => {
        const href = 'https://ya.ru/';

        serialize(
            doc(p(a({href, [LinkAttr.RawLink]: true}, href), anchor('text'))),
            `<${href}>#[text](anchor)`,
        );
    });

    it('should keep a raw link at the end of a textblock', () => {
        const href = 'https://ya.ru/';

        serialize(doc(p(a({href, [LinkAttr.RawLink]: true}, href)), p('text')), href + '\n\ntext');
    });

    it('should preserve an autolink followed by an image', () => {
        const href = 'https://ya.ru/';

        same('<https://ya.ru/>![alttext](/path/to/img.png)', doc(p(a({href}, href), img())));
    });

    it('should keep an image inside the same link', () => {
        const href = 'https://ya.ru/';

        serialize(
            doc(p(a({href, [LinkAttr.RawLink]: true}, href, img()))),
            '[https://ya.ru/![alttext](/path/to/img.png)](https://ya.ru/)',
        );
    });

    it('should escape parentheses in url', () =>
        same(
            '[parentheses](https://example.com/example=?qwe\\(asd)',
            doc(p(a({[LinkAttr.Href]: 'https://example.com/example=?qwe(asd'}, 'parentheses'))),
        ));

    it('should escape parentheses in url', () =>
        same(
            '[parentheses2](https://example.com/example=?qwe\\(asd\\)\\))',
            doc(p(a({[LinkAttr.Href]: 'https://example.com/example=?qwe(asd))'}, 'parentheses2'))),
        ));
});

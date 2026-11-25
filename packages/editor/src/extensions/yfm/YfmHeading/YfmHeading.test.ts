import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';
import {describe, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {
    BoldSpecs,
    BreakNodeName,
    BreaksSpecs,
    CodeSpecs,
    ImageSpecs,
    boldMarkName,
    codeMarkName,
    headingNodeName,
    imageNodeName,
} from '../../markdown/specs';
import {YfmConfigsSpecs} from '../specs';

import {YfmHeadingAttr, YfmHeadingSpecs} from './YfmHeadingSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(YfmConfigsSpecs, {attrs: {allowedAttributes: ['id']}})
            .use(YfmHeadingSpecs, {})
            .use(BoldSpecs),
}).buildDeps();

const {doc, b, p, h, h1, h2, h3, h4, h5, h6} = builders<
    'doc' | 'p' | 'h' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    'b'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    b: {nodeType: boldMarkName},
    p: {nodeType: BaseNode.Paragraph},
    h: {nodeType: headingNodeName},
    h1: {nodeType: headingNodeName, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 1},
    h2: {nodeType: headingNodeName, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 2},
    h3: {nodeType: headingNodeName, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 3},
    h4: {nodeType: headingNodeName, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 4},
    h5: {nodeType: headingNodeName, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 5},
    h6: {nodeType: headingNodeName, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 6},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Heading extension', () => {
    it('should parse h1', () => {
        same('# one', doc(h1('one')));
    });

    it('should parse h2', () => {
        same('## two', doc(h2('two')));
    });

    it('should parse h3', () => {
        same('### three', doc(h3('three')));
    });

    it('should parse h4', () => {
        same('#### four', doc(h4('four')));
    });

    it('should parse h5', () => {
        same('##### five', doc(h5('five')));
    });

    it('should parse h6', () => {
        same('###### six', doc(h6('six')));
    });

    it('should parse haeding wiht marks', () => {
        same(
            '## heading with **bold** {#heading-with-bold}',
            doc(h2({[YfmHeadingAttr.Id]: 'heading-with-bold'}, 'heading with ', b('bold'))),
        );
    });

    it('should parse few headings', () => {
        const markup = dd`
            # h1 {#one}

            ## h2 {#two}

            ### h3 {#three}

            #### h4 {#four}

            ##### h5 {#five}

            ###### h6 {#six}

            para
            `.trim();

        same(
            markup,
            doc(
                h1({[YfmHeadingAttr.Id]: 'one'}, 'h1'),
                h2({[YfmHeadingAttr.Id]: 'two'}, 'h2'),
                h3({[YfmHeadingAttr.Id]: 'three'}, 'h3'),
                h4({[YfmHeadingAttr.Id]: 'four'}, 'h4'),
                h5({[YfmHeadingAttr.Id]: 'five'}, 'h5'),
                h6({[YfmHeadingAttr.Id]: 'six'}, 'h6'),
                p('para'),
            ),
        );
    });

    describe.each([false, true])('with markdown-it-attrs=%s', (enableAttrs) => {
        const {
            schema,
            markupParser: parser,
            serializer,
        } = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(BoldSpecs)
                    .use(CodeSpecs)
                    .use(ImageSpecs)
                    .use(BreaksSpecs, {})
                    .use(YfmConfigsSpecs, {disableAttrs: !enableAttrs})
                    .use(YfmHeadingSpecs, {}),
        }).buildDeps();
        const {same, parse} = createMarkupChecker({parser, serializer});

        const {doc, b, code, img, sb, p, h} = builders<
            'doc' | 'p' | 'h' | 'img' | 'sb',
            'b' | 'code'
        >(schema, {
            doc: {nodeType: BaseNode.Doc},
            b: {markType: boldMarkName},
            code: {markType: codeMarkName},
            img: {nodeType: imageNodeName, src: 'image.png', alt: 'alt'},
            sb: {nodeType: BreakNodeName.SoftBreak},
            p: {nodeType: BaseNode.Paragraph},
            h: {nodeType: headingNodeName},
        });

        it('should parse headings with id', () => {
            const markup = dd`
            # h1 {#one}

            ## h2 {#two}

            ### h3 {#three}

            #### h4 {#four}

            ##### h5 {#five}

            ###### h6 {#six}

            para
            `.trim();

            same(
                markup,
                doc(
                    h({[YfmHeadingAttr.Level]: 1, [YfmHeadingAttr.Id]: 'one'}, 'h1'),
                    h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'two'}, 'h2'),
                    h({[YfmHeadingAttr.Level]: 3, [YfmHeadingAttr.Id]: 'three'}, 'h3'),
                    h({[YfmHeadingAttr.Level]: 4, [YfmHeadingAttr.Id]: 'four'}, 'h4'),
                    h({[YfmHeadingAttr.Level]: 5, [YfmHeadingAttr.Id]: 'five'}, 'h5'),
                    h({[YfmHeadingAttr.Level]: 6, [YfmHeadingAttr.Id]: 'six'}, 'h6'),
                    p('para'),
                ),
            );
        });

        it('should parse id with dots', () => {
            const markup = dd`
            ## Heading2 {#heading.two}
            `.trim();

            same(
                markup,
                doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'heading.two'}, 'Heading2')),
            );
        });

        it('should parse id in russian', () => {
            const markup = dd`
            ## Заголовок2 {#якорь.два}
            `.trim();

            same(
                markup,
                doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'якорь.два'}, 'Заголовок2')),
            );
        });

        it('should parse id in heading with inline markup', () => {
            const markup = dd`
            ## Head**ing**two {#anchor.second}
            `.trim();

            same(
                markup,
                doc(
                    h(
                        {[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'anchor.second'},
                        'Head',
                        b('ing'),
                        'two',
                    ),
                ),
            );
        });

        it('should keep the space after bold in a heading with a custom id', () => {
            const markup = '## Open the **next** chapter {#chapter}';

            same(
                markup,
                doc(
                    h(
                        {[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'chapter'},
                        'Open the ',
                        b('next'),
                        ' chapter',
                    ),
                ),
            );
        });

        it.each([
            '{#id} Title',
            'Title {#id} next',
            'Title {#id}next',
            'Title{#id}',
            'Title{  #id  }',
            'Title {  #id  } next',
            'Title{#id .class}',
            'Title {#id .class} next',
            '{id="id" title="hint"} Title',
            'Title{id="id" title="hint"}',
            'Title{.class}',
            'Title {#one{#two}}',
        ])('should keep a custom id outside a separated heading suffix: %s', (content) => {
            parse(`## ${content}`, doc(h({[YfmHeadingAttr.Level]: 2}, content)));
        });

        it('should keep a custom id before bold as text', () => {
            parse(
                '## Title {#id} **next**',
                doc(h({[YfmHeadingAttr.Level]: 2}, 'Title {#id} ', b('next'))),
            );
        });

        it.each(['{#id}', '{#id}next', '{#id .class}', '{id="id" title="hint"}', '{.class}'])(
            'should keep a custom id attached to bold as text: %s',
            (suffix) => {
                parse(
                    `## **Title**${suffix}`,
                    doc(h({[YfmHeadingAttr.Level]: 2}, b('Title'), suffix)),
                );
            },
        );

        it('should keep a custom id between bold marks as text', () => {
            parse(
                '## **Title** {#id} **next**',
                doc(h({[YfmHeadingAttr.Level]: 2}, b('Title'), ' {#id} ', b('next'))),
            );
        });

        it.each([
            ['Title {#literal} next {#id} {#alias}', 'Title {#literal} next {#id}', 'alias'],
            ['Title {#first .class} {#last}', 'Title {#first .class}', 'last'],
            ['Title {#one}{#two}', 'Title {#one}', 'two'],
        ])('should remove only the final custom id: %s', (content, title, id) => {
            parse(
                `## ${content}`,
                doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: id}, title)),
            );
        });

        it.each([
            {markup: '## Title {#**id**}', content: b('id')},
            {markup: '## Title {#`id`}', content: code('id')},
            {markup: '## Title {#![alt](image.png)}', content: img()},
        ])('should keep inline content inside custom id braces: $markup', ({markup, content}) => {
            parse(markup, doc(h({[YfmHeadingAttr.Level]: 2}, 'Title {#', content, '}')));
        });

        it('should keep a custom id inside bold', () => {
            parse('## Title **{#id}**', doc(h({[YfmHeadingAttr.Level]: 2}, 'Title ', b('{#id}'))));
        });

        it('should parse a plain custom id after braces with inline content', () => {
            parse(
                '## Title {#**literal**} {#id}',
                doc(
                    h(
                        {[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'id'},
                        'Title {#',
                        b('literal'),
                        '}',
                    ),
                ),
            );
        });

        it.each(['{#id .class}', '{id="id" title="hint"}'])(
            'should parse separated mixed heading attributes only when enabled: %s',
            (attributes) => {
                parse(
                    `## Title ${attributes}`,
                    enableAttrs
                        ? doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'id'}, 'Title'))
                        : doc(h({[YfmHeadingAttr.Level]: 2}, `Title ${attributes}`)),
                );
            },
        );

        it('should keep marks inside a mixed attribute block', () => {
            parse(
                '## Title {#id title="**hint**"}',
                doc(h({[YfmHeadingAttr.Level]: 2}, 'Title {#id title="', b('hint'), '"}')),
            );
        });

        it.each([
            ['Title {#first} {#last .class}', 'Title {#first}'],
            ['Title {#first .class} {#last .class}', 'Title {#first .class}'],
            ['Title {#first .class}{#last .class}', 'Title {#first .class}'],
        ])('should parse only the last mixed attribute block: %s', (content, title) => {
            parse(
                `## ${content}`,
                enableAttrs
                    ? doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'last'}, title))
                    : doc(h({[YfmHeadingAttr.Level]: 2}, content)),
            );
        });

        it('should parse a separated custom id with spaces inside its braces', () => {
            parse(
                '## Title {  #id  }',
                doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'id'}, 'Title')),
            );
        });

        it.each(['===', '---'])('should parse a multiline Setext heading: %s', (underline) => {
            parse(
                `head\ning\n${underline}`,
                doc(h({[YfmHeadingAttr.Level]: underline === '===' ? 1 : 2}, 'head', sb(), 'ing')),
            );
        });

        it.each([
            'head\ning {#id}\n===',
            'head\ning\t{#id}\n===',
            'head\ning\n{#id}\n===',
            'head\ning  \n{#id}\n===',
            'head\ning\\\n{#id}\n===',
        ])('should parse a separated custom id at the end of a Setext heading: %s', (markup) => {
            parse(
                markup,
                doc(h({[YfmHeadingAttr.Level]: 1, [YfmHeadingAttr.Id]: 'id'}, 'head', sb(), 'ing')),
            );
        });

        it('should keep a custom id in the middle of a Setext heading', () => {
            parse(
                'head {#id}\ning\n===',
                doc(h({[YfmHeadingAttr.Level]: 1}, 'head {#id}', sb(), 'ing')),
            );
        });

        it('should keep a custom id without a separator in a Setext heading', () => {
            parse(
                'head\ning{#id}\n===',
                doc(h({[YfmHeadingAttr.Level]: 1}, 'head', sb(), 'ing{#id}')),
            );
        });

        it('should parse only the last custom id on final lines of a Setext heading', () => {
            parse(
                'head\ning\n{#id}\n{#alias}\n===',
                doc(
                    h(
                        {[YfmHeadingAttr.Level]: 1, [YfmHeadingAttr.Id]: 'alias'},
                        'head',
                        sb(),
                        'ing',
                        sb(),
                        '{#id}',
                    ),
                ),
            );
        });

        it('should keep the legacy bracketed custom id syntax', () => {
            parse(
                '## Title [{#id}]',
                doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'id'}, 'Title')),
            );
        });

        it('should keep the title placeholder and its space when removing a custom id', () => {
            parse(
                '## Title [{#T}] {#id}',
                doc(h({[YfmHeadingAttr.Level]: 2, [YfmHeadingAttr.Id]: 'id'}, 'Title [{#T}]')),
            );
        });
    });

    it.each([1, 2, 3, 4, 5, 6])('should parse html - h%s tag', (lvl) => {
        parseDOM(
            schema,
            `<h${lvl}>Heading ${lvl}</h${lvl}>`,
            doc(h({[YfmHeadingAttr.Level]: lvl}, `Heading ${lvl}`)),
        );
    });

    it.each([1, 2, 3, 4, 5, 6])(
        'should parse html and ignore yfm-anchors inside headings - h%s tag',
        (lvl) => {
            parseDOM(
                schema,
                `<h${lvl} id="zagolovok-${lvl}" data-line="0" class="line"><a href="#zagolovok-${lvl}" class="yfm-anchor" aria-hidden="true"><span class="visually-hidden">Заголовок ${lvl}</span></a>Заголовок ${lvl}</h${lvl}>`,
                doc(
                    h(
                        {[YfmHeadingAttr.Level]: lvl, [YfmHeadingAttr.Id]: `zagolovok-${lvl}`},
                        `Заголовок ${lvl}`,
                    ),
                ),
            );
        },
    );
});
